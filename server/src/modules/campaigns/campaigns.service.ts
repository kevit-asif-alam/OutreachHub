import { 
  Injectable, 
  NotFoundException, 
  BadRequestException,
  ForbiddenException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Campaign, CampaignDocument, CampaignStatus } from './schemas/campaign.schema';
import { CampaignMessage, CampaignMessageDocument, MessageStatus } from './schemas/campaign-message.schema';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { UserRole } from '../auth/schemas/user.schema';
import { ContactsService } from '../contacts/contacts.service';
import { MessageTemplatesService } from '../message-templates/message-templates.service';

@Injectable()
export class CampaignsService {
  constructor(
    @InjectModel(Campaign.name) private campaignModel: Model<CampaignDocument>,
    @InjectModel(CampaignMessage.name) private campaignMessageModel: Model<CampaignMessageDocument>,
    private contactsService: ContactsService,
    private messageTemplatesService: MessageTemplatesService,
  ) {}

  async create(dto: CreateCampaignDto & { workspaceId: string; createdBy: string }) {
    // Verify template exists and belongs to workspace
    const template = await this.messageTemplatesService.findOne(
      dto.templateId,
      dto.workspaceId
    );

    if (!template) {
      throw new NotFoundException('Message template not found');
    }

    // Validate dates
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid startDate or endDate');
    }
    if (endDate <= startDate) {
      throw new BadRequestException('endDate must be after startDate');
    }

    // Pre-calculate contacts matching tags for initial totals (messages still 0 until launch)
    const contacts = await this.contactsService.findByTags(dto.workspaceId, dto.targetTags || []);

    const campaign = await this.campaignModel.create({
      ...dto,
      templateId: new Types.ObjectId(dto.templateId),
      workspaceId: new Types.ObjectId(dto.workspaceId),
      createdBy: new Types.ObjectId(dto.createdBy),
      startDate,
      endDate,
      totalContacts: contacts.length,
      messagesSent: 0,
      messagesFailed: 0,
    });

    return campaign;
  }

  async findAll(workspaceId: string, page: number = 1, limit: number = 10, search?: string) {
    const query: any = { workspaceId: new Types.ObjectId(workspaceId) };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    
    const [campaigns, total] = await Promise.all([
      this.campaignModel
        .find(query)
        .populate('templateId', 'name type')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.campaignModel.countDocuments(query),
    ]);

    return {
      campaigns,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, workspaceId: string) {
    const campaign = await this.campaignModel
      .findOne({
        _id: new Types.ObjectId(id),
        workspaceId: new Types.ObjectId(workspaceId),
      })
      .populate('templateId', 'name type content imageUrl')
      .lean();

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    return campaign;
  }

  async update(id: string, dto: UpdateCampaignDto, workspaceId: string, updatedBy: string) {
    const campaign = await this.campaignModel.findOne({
      _id: new Types.ObjectId(id),
      workspaceId: new Types.ObjectId(workspaceId),
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    // Only allow updates to draft campaigns
    if (campaign.status !== CampaignStatus.DRAFT) {
      throw new BadRequestException('Only draft campaigns can be updated');
    }

    // If template is being updated, verify it exists
    if (dto.templateId) {
      const template = await this.messageTemplatesService.findOne(
        dto.templateId,
        workspaceId
      );

      if (!template) {
        throw new NotFoundException('Message template not found');
      }
    }

    // Handle startDate/endDate updates with validation
    let nextStart: Date | undefined;
    let nextEnd: Date | undefined;

    if ((dto as any).startDate !== undefined) {
      const parsed = new Date((dto as any).startDate as any);
      if (isNaN(parsed.getTime())) {
        throw new BadRequestException('Invalid startDate');
      }
      nextStart = parsed;
    } else {
      nextStart = campaign.startDate;
    }

    if ((dto as any).endDate !== undefined) {
      const parsed = new Date((dto as any).endDate as any);
      if (isNaN(parsed.getTime())) {
        throw new BadRequestException('Invalid endDate');
      }
      nextEnd = parsed;
    } else {
      nextEnd = campaign.endDate;
    }

    if (nextStart && nextEnd && nextEnd <= nextStart) {
      throw new BadRequestException('endDate must be after startDate');
    }

    const updateDoc: any = {
      ...dto,
      templateId: dto.templateId ? new Types.ObjectId(dto.templateId) : undefined,
      updatedBy: new Types.ObjectId(updatedBy),
    };

    if ((dto as any).startDate !== undefined) updateDoc.startDate = nextStart;
    if ((dto as any).endDate !== undefined) updateDoc.endDate = nextEnd;

    return this.campaignModel.findByIdAndUpdate(id, updateDoc, { new: true });
  }

  async remove(id: string, workspaceId: string) {
    const campaign = await this.campaignModel.findOne({
      _id: new Types.ObjectId(id),
      workspaceId: new Types.ObjectId(workspaceId),
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    // Only allow deletion of draft campaigns
    if (campaign.status !== CampaignStatus.DRAFT) {
      throw new BadRequestException('Only draft campaigns can be deleted');
    }

    // Soft delete
    return this.campaignModel.findByIdAndUpdate(
      id,
      { deletedAt: new Date() },
      { new: true }
    );
  }

  async copy(id: string, workspaceId: string, createdBy: string) {
    const originalCampaign = await this.campaignModel.findOne({
      _id: new Types.ObjectId(id),
      workspaceId: new Types.ObjectId(workspaceId),
    });

    if (!originalCampaign) {
      throw new NotFoundException('Campaign not found');
    }

    const newCampaign = await this.campaignModel.create({
      name: `${originalCampaign.name} (Copy)`,
      description: originalCampaign.description,
      targetTags: originalCampaign.targetTags,
      templateId: originalCampaign.templateId,
      workspaceId: new Types.ObjectId(workspaceId),
      createdBy: new Types.ObjectId(createdBy),
      status: CampaignStatus.DRAFT,
    });

    return newCampaign;
  }

  async launch(id: string, workspaceId: string) {
    const campaign = await this.campaignModel.findOne({
      _id: new Types.ObjectId(id),
      workspaceId: new Types.ObjectId(workspaceId),
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    // Allow launching draft or completed (relaunch)
    if (![CampaignStatus.DRAFT, CampaignStatus.COMPLETED].includes(campaign.status)) {
      throw new BadRequestException('Only draft or completed campaigns can be launched');
    }

    // Allow launching at any time (per requirement). The campaign will auto-complete after endDate in getCampaignStatus.

    // Get template details
    const template = await this.messageTemplatesService.findOne(
      campaign.templateId.toString(),
      workspaceId
    );

    if (!template) {
      throw new NotFoundException('Message template not found');
    }

    // Get contacts with target tags
    const contacts = await this.contactsService.findByTags(workspaceId, campaign.targetTags);

    if (contacts.length === 0) {
      throw new BadRequestException('No contacts found with the specified tags');
    }

    // On relaunch, clear previous messages and counters
    if (campaign.status === CampaignStatus.COMPLETED) {
      await this.campaignMessageModel.deleteMany({ campaignId: new Types.ObjectId(id) });
      await this.campaignModel.findByIdAndUpdate(id, {
        messagesSent: 0,
        messagesFailed: 0,
        completedAt: null,
      });
    }

    // Update campaign status to running
    await this.campaignModel.findByIdAndUpdate(id, {
      status: CampaignStatus.RUNNING,
      launchedAt: new Date(),
      totalContacts: contacts.length,
    });

    // Create campaign messages for each contact
    const campaignMessages = contacts.map(contact => ({
      campaignId: new Types.ObjectId(id),
      contactId: contact._id,
      templateId: campaign.templateId,
      workspaceId: new Types.ObjectId(workspaceId),
      messageContent: this.processTemplate(template.content, contact),
      imageUrl: template.imageUrl,
      status: MessageStatus.PENDING,
      contactPhoneNumber: contact.phoneNumber,
      contactFirstName: contact.firstName,
      contactLastName: contact.lastName,
      contactEmail: contact.email,
      templateName: template.name,
      templateType: template.type,
    }));

    await this.campaignMessageModel.insertMany(campaignMessages);

    // Simulate sending messages (in a real app, this would integrate with SMS service)
    this.simulateMessageSending(id, campaignMessages.length);

    return {
      message: 'Campaign launched successfully',
      totalContacts: contacts.length,
      campaignId: id,
    };
  }

  async stop(id: string, workspaceId: string) {
    const campaign = await this.campaignModel.findOne({
      _id: new Types.ObjectId(id),
      workspaceId: new Types.ObjectId(workspaceId),
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    if (campaign.status !== CampaignStatus.RUNNING) {
      throw new BadRequestException('Only running campaigns can be stopped');
    }

    await this.campaignModel.findByIdAndUpdate(id, {
      status: CampaignStatus.COMPLETED,
      completedAt: new Date(),
    });

    return { message: 'Campaign stopped' };
  }

  async complete(id: string, workspaceId: string) {
    const campaign = await this.campaignModel.findOne({
      _id: new Types.ObjectId(id),
      workspaceId: new Types.ObjectId(workspaceId),
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    if (campaign.status !== CampaignStatus.RUNNING) {
      throw new BadRequestException('Only running campaigns can be completed');
    }

    await this.campaignModel.findByIdAndUpdate(id, {
      status: CampaignStatus.COMPLETED,
      completedAt: new Date(),
    });

    return { message: 'Campaign completed' };
  }

  private processTemplate(content: string, contact: any): string {
    return content
      .replace(/\{\{firstName\}\}/g, contact.firstName)
      .replace(/\{\{lastName\}\}/g, contact.lastName)
      .replace(/\{\{email\}\}/g, contact.email || '')
      .replace(/\{\{phoneNumber\}\}/g, contact.phoneNumber);
  }

  private async simulateMessageSending(campaignId: string, totalMessages: number) {
    // Simulate message sending with delays
    const batchSize = 10;
    const delay = 1000; // 1 second delay between batches

    for (let i = 0; i < totalMessages; i += batchSize) {
      // Bail out early if campaign has been stopped/completed
      const current = await this.campaignModel.findById(campaignId).lean();
      if (!current || current.status !== CampaignStatus.RUNNING) {
        break;
      }
      const batch = await this.campaignMessageModel
        .find({ campaignId: new Types.ObjectId(campaignId), status: MessageStatus.PENDING })
        .limit(batchSize);

      for (const message of batch) {
        // Simulate sending (90% success rate)
        const success = Math.random() > 0.1;
        
        await this.campaignMessageModel.findByIdAndUpdate(message._id, {
          status: success ? MessageStatus.SENT : MessageStatus.FAILED,
          sentAt: new Date(),
          failureReason: success ? undefined : 'Simulated failure',
        });
      }

      // Update campaign statistics
      const [sentCount, failedCount] = await Promise.all([
        this.campaignMessageModel.countDocuments({
          campaignId: new Types.ObjectId(campaignId),
          status: MessageStatus.SENT,
        }),
        this.campaignMessageModel.countDocuments({
          campaignId: new Types.ObjectId(campaignId),
          status: MessageStatus.FAILED,
        }),
      ]);

      await this.campaignModel.findByIdAndUpdate(campaignId, {
        messagesSent: sentCount,
        messagesFailed: failedCount,
      });

      // Add delay between batches
      if (i + batchSize < totalMessages) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // Do not auto-complete here; completion will be determined by endDate in getCampaignStatus
  }

  async getCampaignStatus(id: string, workspaceId: string) {
    const campaign = await this.campaignModel
      .findOne({
        _id: new Types.ObjectId(id),
        workspaceId: new Types.ObjectId(workspaceId),
      })
      .lean();

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    const [messagesSent, messagesDelivered, messagesFailed] = await Promise.all([
      this.campaignMessageModel.countDocuments({
        campaignId: new Types.ObjectId(id),
        status: MessageStatus.SENT,
      }),
      this.campaignMessageModel.countDocuments({
        campaignId: new Types.ObjectId(id),
        status: MessageStatus.DELIVERED,
      }),
      this.campaignMessageModel.countDocuments({
        campaignId: new Types.ObjectId(id),
        status: MessageStatus.FAILED,
      }),
    ]);

    // If campaign is running and endDate has passed, mark completed now
    if (campaign.status === CampaignStatus.RUNNING && campaign.endDate && new Date(campaign.endDate) <= new Date()) {
      await this.campaignModel.findByIdAndUpdate(id, {
        status: CampaignStatus.COMPLETED,
        completedAt: new Date(),
      });
      campaign.status = CampaignStatus.COMPLETED;
      campaign.completedAt = new Date();
    }

    return {
      ...campaign,
      messagesSent,
      messagesDelivered,
      messagesFailed,
    };
  }

  async getCampaignStats(workspaceId: string) {
    const [totalCampaigns, draftCampaigns, runningCampaigns, completedCampaigns] = await Promise.all([
      this.campaignModel.countDocuments({ workspaceId: new Types.ObjectId(workspaceId) }),
      this.campaignModel.countDocuments({ 
        workspaceId: new Types.ObjectId(workspaceId),
        status: CampaignStatus.DRAFT
      }),
      this.campaignModel.countDocuments({ 
        workspaceId: new Types.ObjectId(workspaceId),
        status: CampaignStatus.RUNNING
      }),
      this.campaignModel.countDocuments({ 
        workspaceId: new Types.ObjectId(workspaceId),
        status: CampaignStatus.COMPLETED
      }),
    ]);

    return {
      totalCampaigns,
      draftCampaigns,
      runningCampaigns,
      completedCampaigns,
    };
  }
}



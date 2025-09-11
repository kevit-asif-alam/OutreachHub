import { 
  Injectable, 
  NotFoundException, 
  BadRequestException,
  ForbiddenException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MessageTemplate, MessageTemplateDocument } from './schemas/message-template.schema';
import { CreateMessageTemplateDto } from './dto/create-message-template.dto';
import { UpdateMessageTemplateDto } from './dto/update-message-template.dto';
import { UserRole } from '../auth/schemas/user.schema';

@Injectable()
export class MessageTemplatesService {
  constructor(
    @InjectModel(MessageTemplate.name) private templateModel: Model<MessageTemplateDocument>,
  ) {}

  async create(dto: CreateMessageTemplateDto & { workspaceId: string; createdBy: string }) {
    const template = await this.templateModel.create({
      ...dto,
      workspaceId: new Types.ObjectId(dto.workspaceId),
      createdBy: new Types.ObjectId(dto.createdBy),
    });

    return template;
  }

  async findAll(workspaceId: string, page: number = 1, limit: number = 10, search?: string) {
    const query: any = { workspaceId: new Types.ObjectId(workspaceId) };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    
    const [templates, total] = await Promise.all([
      this.templateModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.templateModel.countDocuments(query),
    ]);

    return {
      templates,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, workspaceId: string) {
    const template = await this.templateModel
      .findOne({
        _id: new Types.ObjectId(id),
        workspaceId: new Types.ObjectId(workspaceId),
      })
      .lean();

    if (!template) {
      throw new NotFoundException('Message template not found');
    }

    return template;
  }

  async update(id: string, dto: UpdateMessageTemplateDto, workspaceId: string, updatedBy: string) {
    const template = await this.templateModel.findOne({
      _id: new Types.ObjectId(id),
      workspaceId: new Types.ObjectId(workspaceId),
    });

    if (!template) {
      throw new NotFoundException('Message template not found');
    }

    return this.templateModel.findByIdAndUpdate(
      id,
      {
        ...dto,
        updatedBy: new Types.ObjectId(updatedBy),
      },
      { new: true }
    );
  }

  async remove(id: string, workspaceId: string) {
    const template = await this.templateModel.findOne({
      _id: new Types.ObjectId(id),
      workspaceId: new Types.ObjectId(workspaceId),
    });

    if (!template) {
      throw new NotFoundException('Message template not found');
    }

    // Soft delete
    return this.templateModel.findByIdAndUpdate(
      id,
      { deletedAt: new Date() },
      { new: true }
    );
  }

  async getTemplateStats(workspaceId: string) {
    const [totalTemplates, textTemplates, imageTemplates] = await Promise.all([
      this.templateModel.countDocuments({ workspaceId: new Types.ObjectId(workspaceId) }),
      this.templateModel.countDocuments({ 
        workspaceId: new Types.ObjectId(workspaceId),
        type: 'text'
      }),
      this.templateModel.countDocuments({ 
        workspaceId: new Types.ObjectId(workspaceId),
        type: 'text_and_image'
      }),
    ]);

    return {
      totalTemplates,
      textTemplates,
      imageTemplates,
    };
  }
}



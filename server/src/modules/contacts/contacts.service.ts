import { 
  Injectable, 
  NotFoundException, 
  ConflictException, 
  BadRequestException,
  ForbiddenException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Contact, ContactDocument } from './schemas/contact.schema';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { UserRole } from '../auth/schemas/user.schema';

@Injectable()
export class ContactsService {
  constructor(
    @InjectModel(Contact.name) private contactModel: Model<ContactDocument>,
  ) {}

  async create(dto: CreateContactDto & { workspaceId: string; createdBy: string }) {
    // Check if contact with same phone number already exists in this workspace
    const existingContact = await this.contactModel.findOne({
      phoneNumber: dto.phoneNumber,
      workspaceId: dto.workspaceId,
    });

    if (existingContact) {
      throw new ConflictException('Contact with this phone number already exists in this workspace');
    }

    const contact = await this.contactModel.create({
      ...dto,
      workspaceId: new Types.ObjectId(dto.workspaceId),
      createdBy: new Types.ObjectId(dto.createdBy),
    });

    return contact;
  }

  async findAll(workspaceId: string, page: number = 1, limit: number = 10, search?: string) {
    const query: any = { workspaceId: new Types.ObjectId(workspaceId) };
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    
    const [contacts, total] = await Promise.all([
      this.contactModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.contactModel.countDocuments(query),
    ]);

    return {
      contacts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, workspaceId: string) {
    const contact = await this.contactModel
      .findOne({
        _id: new Types.ObjectId(id),
        workspaceId: new Types.ObjectId(workspaceId),
      })
      .lean();

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    return contact;
  }

  async update(id: string, dto: UpdateContactDto, workspaceId: string, updatedBy: string) {
    const contact = await this.contactModel.findOne({
      _id: new Types.ObjectId(id),
      workspaceId: new Types.ObjectId(workspaceId),
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    // Check if phone number is being updated and if it conflicts
    if (dto.phoneNumber && dto.phoneNumber !== contact.phoneNumber) {
      const existingContact = await this.contactModel.findOne({
        phoneNumber: dto.phoneNumber,
        workspaceId: new Types.ObjectId(workspaceId),
        _id: { $ne: new Types.ObjectId(id) },
      });

      if (existingContact) {
        throw new ConflictException('Contact with this phone number already exists in this workspace');
      }
    }

    return this.contactModel.findByIdAndUpdate(
      id,
      {
        ...dto,
        updatedBy: new Types.ObjectId(updatedBy),
      },
      { new: true }
    );
  }

  async remove(id: string, workspaceId: string) {
    const contact = await this.contactModel.findOne({
      _id: new Types.ObjectId(id),
      workspaceId: new Types.ObjectId(workspaceId),
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    // Soft delete
    return this.contactModel.findByIdAndUpdate(
      id,
      { deletedAt: new Date() },
      { new: true }
    );
  }

  async findByTags(workspaceId: string, tags: string[]) {
    return this.contactModel
      .find({
        workspaceId: new Types.ObjectId(workspaceId),
        tags: { $in: tags },
      })
      .lean();
  }

  async getTags(workspaceId: string) {
    const result = await this.contactModel.aggregate([
      { $match: { workspaceId: new Types.ObjectId(workspaceId) } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    return result.map(item => ({
      tag: item._id,
      count: item.count,
    }));
  }

  async getContactStats(workspaceId: string) {
    const [totalContacts, tagsWithCounts] = await Promise.all([
      this.contactModel.countDocuments({ workspaceId: new Types.ObjectId(workspaceId) }),
      this.getTags(workspaceId),
    ]);

    return {
      totalContacts,
      topTags: tagsWithCounts.slice(0, 5),
    };
  }
}



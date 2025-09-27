import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Campaign, CampaignDocument } from '../campaigns/schemas/campaign.schema';
import { CampaignMessage, CampaignMessageDocument } from '../campaigns/schemas/campaign-message.schema';
import { Contact, ContactDocument } from '../contacts/schemas/contact.schema';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Campaign.name) private campaignModel: Model<CampaignDocument>,
    @InjectModel(CampaignMessage.name) private campaignMessageModel: Model<CampaignMessageDocument>,
    @InjectModel(Contact.name) private contactModel: Model<ContactDocument>,
  ) {}

  async getDashboardStats(workspaceId: string) {
    const [contactStats, campaignStats, recentCampaigns, topTags] = await Promise.all([
      this.getContactStats(workspaceId),
      this.getCampaignStats(workspaceId),
      this.getRecentCampaigns(workspaceId),
      this.getTopTags(workspaceId),
    ]);

    return {
      contactStats,
      campaignStats,
      recentCampaigns,
      topTags,
    };
  }

  async getContactStats(workspaceId: string) {
    const totalContacts = await this.contactModel.countDocuments({
      workspaceId: new Types.ObjectId(workspaceId),
    });

    return { totalContacts };
  }

  async getCampaignStats(workspaceId: string) {
    const [totalCampaigns, completedCampaigns, runningCampaigns] = await Promise.all([
      this.campaignModel.countDocuments({ workspaceId: new Types.ObjectId(workspaceId) }),
      this.campaignModel.countDocuments({ 
        workspaceId: new Types.ObjectId(workspaceId),
        status: 'completed'
      }),
      this.campaignModel.countDocuments({ 
        workspaceId: new Types.ObjectId(workspaceId),
        status: 'running'
      }),
    ]);

    return {
      totalCampaigns,
      completedCampaigns,
      runningCampaigns,
    };
  }

  async getRecentCampaigns(workspaceId: string, limit: number = 5) {
    return this.campaignModel
      .find({ workspaceId: new Types.ObjectId(workspaceId) })
      .populate('templateId', 'name type')
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('name targetTags status createdAt launchedAt')
      .lean();
  }

  async getTopTags(workspaceId: string, limit: number = 5) {
    const result = await this.contactModel.aggregate([
      { $match: { workspaceId: new Types.ObjectId(workspaceId) } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
    ]);

    return result.map(item => ({
      tag: item._id,
      count: item.count,
    }));
  }

  async getCampaignsPerDay(workspaceId: string, startDate?: Date, endDate?: Date) {
    const matchQuery: any = { workspaceId: new Types.ObjectId(workspaceId) };
    
    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = startDate;
      if (endDate) matchQuery.createdAt.$lte = endDate;
    }

    const result = await this.campaignModel.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);

    return result.map(item => ({
      date: new Date(item._id.year, item._id.month - 1, item._id.day).toISOString().split('T')[0],
      count: item.count,
    }));
  }

  async getMessagesPerTypePerDay(workspaceId: string, startDate?: Date, endDate?: Date) {
    const matchQuery: any = { workspaceId: new Types.ObjectId(workspaceId) };
    
    if (startDate || endDate) {
      matchQuery.sentAt = {};
      if (startDate) matchQuery.sentAt.$gte = startDate;
      if (endDate) matchQuery.sentAt.$lte = endDate;
    }

    const result = await this.campaignMessageModel.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            year: { $year: '$sentAt' },
            month: { $month: '$sentAt' },
            day: { $dayOfMonth: '$sentAt' },
            type: '$templateType',
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.type': 1 } },
    ]);

    return result.map(item => ({
      date: new Date(item._id.year, item._id.month - 1, item._id.day).toISOString().split('T')[0],
      type: item._id.type,
      count: item.count,
    }));
  }

  async getContactsReachedPerDay(workspaceId: string, startDate?: Date, endDate?: Date) {
    const matchQuery: any = { workspaceId: new Types.ObjectId(workspaceId) };
    
    if (startDate || endDate) {
      matchQuery.sentAt = {};
      if (startDate) matchQuery.sentAt.$gte = startDate;
      if (endDate) matchQuery.sentAt.$lte = endDate;
    }

    const result = await this.campaignMessageModel.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            year: { $year: '$sentAt' },
            month: { $month: '$sentAt' },
            day: { $dayOfMonth: '$sentAt' },
          },
          uniqueContacts: { $addToSet: '$contactId' },
        },
      },
      {
        $project: {
          _id: 1,
          count: { $size: '$uniqueContacts' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);

    return result.map(item => ({
      date: new Date(item._id.year, item._id.month - 1, item._id.day).toISOString().split('T')[0],
      count: item.count,
    }));
  }
}



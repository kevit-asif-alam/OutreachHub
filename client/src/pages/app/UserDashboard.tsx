import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../../services/analytics';
import { messageTemplatesService } from '../../services/messageTemplates';
import Layout from '../../components/layout/Layout';
import { 
  UsersIcon, 
  DocumentTextIcon, 
  MegaphoneIcon,
  ChartBarIcon 
} from '@heroicons/react/24/outline';

const UserDashboard: React.FC = () => {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: analyticsService.getDashboardStats,
  });

  const { data: templateStats } = useQuery({
    queryKey: ['template-stats'],
    queryFn: messageTemplatesService.getStats,
  });

  // Date filters for charts
  const [dateRange, setDateRange] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Helper function to get date range based on selection
  const getDateRange = (range: string) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    switch (range) {
      case 'today':
        return { start: todayStr, end: todayStr };
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 7);
        return { start: weekStart.toISOString().split('T')[0], end: todayStr };
      case 'month':
        const monthStart = new Date(today);
        monthStart.setMonth(today.getMonth() - 1);
        return { start: monthStart.toISOString().split('T')[0], end: todayStr };
      default:
        return { start: '', end: '' };
    }
  };

  // Update date range when selection changes
  React.useEffect(() => {
    const { start, end } = getDateRange(dateRange);
    setStartDate(start);
    setEndDate(end);
  }, [dateRange]);

  const { data: campaignsPerDay } = useQuery({
    queryKey: ['analytics', 'campaigns-per-day', startDate, endDate],
    queryFn: () => analyticsService.getCampaignsPerDay(startDate || undefined, endDate || undefined),
  });

  const { data: messagesPerTypePerDay } = useQuery({
    queryKey: ['analytics', 'messages-per-type-per-day', startDate, endDate],
    queryFn: () => analyticsService.getMessagesPerTypePerDay(startDate || undefined, endDate || undefined),
  });

  const { data: contactsReachedPerDay } = useQuery({
    queryKey: ['analytics', 'contacts-reached-per-day', startDate, endDate],
    queryFn: () => analyticsService.getContactsReachedPerDay(startDate || undefined, endDate || undefined),
  });

  const maxCampaigns = useMemo(() => (campaignsPerDay || []).reduce((m, d) => Math.max(m, d.count), 0), [campaignsPerDay]);
  const maxContacts = useMemo(() => (contactsReachedPerDay || []).reduce((m, d) => Math.max(m, d.count), 0), [contactsReachedPerDay]);
  const groupedMessages = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    (messagesPerTypePerDay || []).forEach((row) => {
      if (!map[row.date]) map[row.date] = {};
      map[row.date][row.type] = row.count;
    });
    return map; // {date: {type: count}}
  }, [messagesPerTypePerDay]);

  if (isLoading) {
    return (
      <Layout title="Dashboard">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Dashboard">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">Error loading dashboard data. Please try again.</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title=""> 
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">Welcome to your workspace!</h2>
          <p className="text-indigo-100">
            Manage your contacts, create message templates, and launch targeted campaigns.
          </p>
        </div>
      <div className="space-y-6">
        {/* Date Range Filter */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Period</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
            <div className="text-xs text-gray-500">
              {dateRange === 'all' && 'Showing data for all available time periods'}
              {dateRange === 'today' && 'Showing data for today only'}
              {dateRange === 'week' && 'Showing data for the last 7 days'}
              {dateRange === 'month' && 'Showing data for the last 30 days'}
            </div>
          </div>
        </div>

        {/* Welcome Message */}
        {/* <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">Welcome to your workspace!</h2>
          <p className="text-indigo-100">
            Manage your contacts, create message templates, and launch targeted campaigns.
          </p>
        </div> */}

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6">
          {/* Campaigns per Day */}
          {/* <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaigns per day</h3>
            {campaignsPerDay && campaignsPerDay.length > 0 ? (
              <div className="flex items-end space-x-2 h-40">
                {campaignsPerDay.map((d) => (
                  <div key={d.date} className="flex flex-col items-center">
                    <div
                      className="w-6 bg-indigo-500 rounded"
                      style={{ height: maxCampaigns ? `${(d.count / maxCampaigns) * 100}%` : '0%' }}
                      title={`${d.date}: ${d.count}`}
                    />
                    <div className="text-[10px] text-gray-500 mt-1">
                      {new Date(d.date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-sm">No data for selected range.</div>
            )}
          </div> */}

          {/* Messages per Type per Day */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Messages per type per day</h3>
            {Object.keys(groupedMessages).length > 0 ? (
              <div className="overflow-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600">
                      <th className="py-2 pr-4">Date</th>
                      <th className="py-2 pr-4">Text</th>
                      <th className="py-2 pr-4">Text & Image</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(groupedMessages).map(([date, byType]) => (
                      <tr key={date} className="border-t">
                        <td className="py-2 pr-4 text-gray-700">{new Date(date).toLocaleDateString()}</td>
                        <td className="py-2 pr-4">{byType['text'] || 0}</td>
                        <td className="py-2 pr-4">{byType['text_and_image'] || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-gray-500 text-sm">No data for selected range.</div>
            )}
          </div>

          {/* Contacts Reached per Day */}
          {/* <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contacts reached per day</h3>
            {contactsReachedPerDay && contactsReachedPerDay.length > 0 ? (
              <div className="flex items-end space-x-2 h-40">
                {contactsReachedPerDay.map((d) => (
                  <div key={d.date} className="flex flex-col items-center">
                    <div
                      className="w-6 bg-emerald-500 rounded"
                      style={{ height: maxContacts ? `${(d.count / maxContacts) * 100}%` : '0%' }}
                      title={`${d.date}: ${d.count}`}
                    />
                    <div className="text-[10px] text-gray-500 mt-1">
                      {new Date(d.date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-sm">No data for selected range.</div>
            )}
          </div> */}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UsersIcon className="icon-md text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Contacts</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.contactStats.totalContacts || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DocumentTextIcon className="icon-md text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Templates</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {templateStats?.totalTemplates ?? 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MegaphoneIcon className="icon-md text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Campaigns</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.campaignStats.totalCampaigns || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <ChartBarIcon className="icon-md text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.campaignStats.completedCampaigns || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Campaigns */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Campaigns</h3>
          </div>
          <div className="px-6 py-4">
            {stats?.recentCampaigns && stats.recentCampaigns.length > 0 ? (
              <div className="space-y-3">
                {stats.recentCampaigns.map((campaign) => (
                  <div key={campaign._id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                      <div className="text-xs text-gray-500">
                        Tags: {campaign.targetTags.join(', ')}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        campaign.status === 'completed' 
                          ? 'bg-green-100 text-green-800'
                          : campaign.status === 'running'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {campaign.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(campaign.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No campaigns created yet.
              </div>
            )}
          </div>
        </div>

        {/* Top Tags */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Top Contact Tags</h3>
          </div>
          <div className="px-6 py-4">
            {stats?.topTags && stats.topTags.length > 0 ? (
              <div className="space-y-3">
                {stats.topTags.map((tag, index) => (
                  <div key={tag.tag} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                      <span className="text-sm text-gray-900">{tag.tag}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{tag.count} contacts</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No tags found.
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default UserDashboard;


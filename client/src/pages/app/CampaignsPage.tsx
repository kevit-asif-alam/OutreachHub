import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { campaignsService } from '../../services/campaigns';
import Layout from '../../components/layout/Layout';
import { PlusIcon, MagnifyingGlassIcon, PlayIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { messageTemplatesService } from '../../services/messageTemplates';
import { contactsService } from '../../services/contacts';
import { useAuth } from '../../contexts/AuthContext';

const CampaignsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    selectedTags: [] as string[],
    templateId: '',
    // new UX: separate date & time pickers to avoid confusion
    startDateOnly: '', // YYYY-MM-DD
    startTimeOnly: '', // HH:MM
    endDateOnly: '',   // YYYY-MM-DD
    endTimeOnly: '',   // HH:MM
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const queryClient = useQueryClient();
  const { currentWorkspace } = useAuth();
  const isViewer = String(currentWorkspace?.role || '').toLowerCase() === 'viewer';
  // no refs needed for date/time inputs; we rely on controlled state

  const { data: campaignsData, isLoading, error } = useQuery({
    queryKey: ['campaigns', page, searchTerm],
    queryFn: () => campaignsService.getAll(page, 10, searchTerm),
    refetchInterval: (q) => {
      const data: any = q.state.data as any;
      const hasRunning = data?.campaigns?.some((c: any) => c.status === 'running');
      return hasRunning ? 3000 : false;
    },
  });

  const { data: templatesData } = useQuery({
    queryKey: ['message-templates', 'dropdown'],
    queryFn: () => messageTemplatesService.getAll(1, 500, ''),
  });

  const [templateNameMap, setTemplateNameMap] = useState<Record<string, string>>({});

  const resolveTemplateName = (campaign: any): string => {
    // 1) server may populate into campaign.template
    if (campaign?.template?.name) return campaign.template.name;
    // 2) server may populate into templateId as object
    if (campaign?.templateId && typeof campaign.templateId === 'object' && campaign.templateId.name) {
      return campaign.templateId.name;
    }
    // 3) campaign may carry templateName (rare)
    if (campaign?.templateName) return campaign.templateName;
    // 4) fallback: look up from loaded templates list using templateId string
    const id = typeof campaign?.templateId === 'string' ? campaign.templateId : campaign?.templateId?._id;
    if (id && templateNameMap[id]) return templateNameMap[id];
    const match = templatesData?.templates?.find((t: any) => t._id === id);
    if (match?.name) return match.name;
    return 'Unknown';
  };

  // Fetch missing template names when campaigns list changes
  React.useEffect(() => {
    const fetchMissing = async () => {
      if (!campaignsData?.campaigns) return;
      const missingIds: string[] = [];
      for (const c of campaignsData.campaigns as any[]) {
        const id = typeof c?.templateId === 'string' ? c.templateId : c?.templateId?._id;
        const hasName = c?.template?.name || (typeof c?.templateId === 'object' && c?.templateId?.name);
        if (id && !hasName) {
          const already = templateNameMap[id];
          const inList = templatesData?.templates?.some((t: any) => t._id === id);
          if (!already && !inList) missingIds.push(id);
        }
      }
      // De-dup and fetch
      const unique = Array.from(new Set(missingIds));
      if (unique.length === 0) return;
      const entries: Record<string, string> = {};
      await Promise.all(unique.map(async (id) => {
        try {
          const t = await messageTemplatesService.getById(id);
          if (t?.name) entries[id] = t.name;
        } catch {}
      }));
      if (Object.keys(entries).length > 0) {
        setTemplateNameMap((prev) => ({ ...prev, ...entries }));
      }
    };
    fetchMissing();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignsData?.campaigns, templatesData?.templates]);

  const { data: tagsData } = useQuery({
    queryKey: ['contacts', 'tags'],
    queryFn: () => contactsService.getTags(),
  });

  // Helper: convert datetime-local value to ISO reliably
  const localDateTimeToISO = (value: string) => {
    // Accept:
    // - YYYY-MM-DDTHH:MM
    // - YYYY-MM-DDTHH:MM:SS
    // - YYYY-MM-DDTHH:MM:SS.sss
    const m = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/);
    if (m) {
      const [_, y, mo, d, h, mi, ss, ms] = m;
      const date = new Date(
        Number(y),
        Number(mo) - 1,
        Number(d),
        Number(h),
        Number(mi),
        ss ? Number(ss) : 0,
        ms ? Number(ms.padEnd(3, '0')) : 0
      );
      return date.toISOString();
    }
    // Fallback: let Date try to parse (last resort)
    const fallback = new Date(value);
    if (!isNaN(fallback.getTime())) return fallback.toISOString();
    return null;
  };

  // Helper: combine separate date & time into ISO (assumes local time)
  const combineLocalDateAndTimeToISO = (dateStr: string, timeStr: string, defaultTime: string) => {
    const d = (dateStr || '').trim();
    const t = ((timeStr || '').trim()) || defaultTime;
    if (!d) return null;
    // Compose to datetime-local string and reuse parser
    return localDateTimeToISO(`${d}T${t}`);
  };

  const createMutation = useMutation({
    mutationFn: () => {
      // Build from separate date/time with sensible defaults
      const startISO = combineLocalDateAndTimeToISO(form.startDateOnly, form.startTimeOnly, '09:00');
      const endISO = combineLocalDateAndTimeToISO(form.endDateOnly, form.endTimeOnly, '18:00');
      if (!startISO || !endISO) {
        throw new Error('Invalid start or end date.');
      }
      const start = new Date(startISO);
      const end = new Date(endISO);
      if (end <= start) {
        throw new Error('End date must be after start date.');
      }
      if (!form.templateId) {
        throw new Error('Please select a message template.');
      }
      return campaignsService.create({
        name: form.name,
        description: form.description || undefined,
        targetTags: form.selectedTags,
        templateId: form.templateId,
        startDate: startISO,
        endDate: endISO,
      });
    },
    onSuccess: () => {
      setShowCreateForm(false);
      setForm({ name: '', description: '', selectedTags: [], templateId: '', startDateOnly: '', startTimeOnly: '', endDateOnly: '', endTimeOnly: '' });
      setErrorMsg('');
      setSuccessMsg('Campaign created successfully!');
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setTimeout(() => setSuccessMsg(''), 3000);
    },
    onError: (err: any) => {
      setErrorMsg(err?.message || err?.response?.data?.message || 'Failed to create campaign');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => campaignsService.update(id, payload),
    onSuccess: () => {
      setShowCreateForm(false);
      setIsEditing(false);
      setEditingId(null);
      setForm({ name: '', description: '', selectedTags: [], templateId: '', startDateOnly: '', startTimeOnly: '', endDateOnly: '', endTimeOnly: '' });
      setErrorMsg('');
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
    onError: (err: any) => {
      setErrorMsg(err?.message || err?.response?.data?.message || 'Failed to update campaign');
    },
  });

  const launchMutation = useMutation({
    mutationFn: (id: string) => campaignsService.launch(id),
    onSuccess: () => {
      // Trigger faster refresh to show running/completed status
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => campaignsService.complete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });

  if (isLoading) {
    return (
      <Layout title="Campaigns">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Campaigns">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">Error loading campaigns. Please try again.</div>
        </div>
      </Layout>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Layout title="Campaigns">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Campaigns</h2>
            <p className="text-gray-600">Create and manage your outreach campaigns</p>
          </div>
          {!isViewer && (
          <button
            onClick={() => { setErrorMsg(''); setShowCreateForm(true); }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors flex items-center space-x-2"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Create Campaign</span>
          </button>
          )}
        </div>

        {/* Search */}
        <div className="max-w-md">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Campaigns List */}
        {campaignsData && campaignsData.campaigns.length > 0 ? (
          <div className="space-y-8">
            {campaignsData.campaigns.map((campaign) => (
              <div key={campaign._id} className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-left text-gray-900 mb-2">{campaign.name}</h3>
                      {campaign.description && (
                        <p className="text-gray-600 text-left text-sm mb-2">{campaign.description}</p>
                      )}
                      <div className="text-xs text-left text-gray-500">
                        Template: <span className="font-medium text-gray-700">{resolveTemplateName(campaign)}</span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(campaign.status)}`}>
                      {campaign.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-gray-500">Target Tags</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {campaign.targetTags.map((tag) => (
                          <span key={tag} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      {/* <div className="text-sm text-gray-500">Template</div> */}
                      {/* <div className="text-sm font-medium text-gray-900">
                        {campaign.template?.name || 'Unknown'}
                      </div> */}
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Contacts</div>
                      <div className="text-sm font-medium text-gray-900">{campaign.totalContacts}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Messages Sent</div>
                      <div className="text-sm font-medium text-gray-900">{campaign.messagesSent}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      Created {new Date(campaign.createdAt).toLocaleDateString()}
                      {campaign.startDate && (
                        <span> • Runs {new Date(campaign.startDate).toLocaleDateString()} → {new Date(campaign.endDate).toLocaleDateString()}</span>
                      )}
                      {campaign.launchedAt && (
                        <span> • Launched {new Date(campaign.launchedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      {!isViewer && campaign.status === 'draft' && (
                        <button
                          className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                          onClick={() => launchMutation.mutate(campaign._id)}
                        >
                          <PlayIcon className="h-4 w-4" />
                          <span>Launch</span>
                        </button>
                      )}
                      {!isViewer && campaign.status === 'draft' && (
                        <button
                          className="flex items-center space-x-1 px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm"
                          onClick={() => {
                            // Prefill form for editing
                            const start = new Date(campaign.startDate);
                            const end = new Date(campaign.endDate);
                            const pad = (n: number) => n.toString().padStart(2, '0');
                            const toDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
                            const toTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
                            setForm({
                              name: campaign.name,
                              description: campaign.description || '',
                              selectedTags: campaign.targetTags || [],
                              templateId: campaign.templateId as any,
                              startDateOnly: toDate(start),
                              startTimeOnly: toTime(start),
                              endDateOnly: toDate(end),
                              endTimeOnly: toTime(end),
                            });
                            setIsEditing(true);
                            setEditingId(campaign._id);
                            setErrorMsg('');
                            setShowCreateForm(true);
                          }}
                        >
                          Edit
                        </button>
                      )}
                      {!isViewer && campaign.status === 'running' && (
                        <button
                          className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                          onClick={() => completeMutation.mutate(campaign._id)}
                          disabled={completeMutation.isPending}
                        >
                          <span>{completeMutation.isPending ? 'Completing...' : 'Complete now'}</span>
                        </button>
                      )}
                      {!isViewer && campaign.status === 'completed' && (
                        <button
                          className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                          onClick={() => launchMutation.mutate(campaign._id)}
                          disabled={launchMutation.isPending}
                        >
                          <span>{launchMutation.isPending ? 'Relaunching...' : 'Relaunch'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500">
              {searchTerm ? 'No campaigns found matching your search.' : 'No campaigns created yet.'}
            </div>
            {/* {!searchTerm && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
              >
                Create your first campaign
              </button>
            )} */}
          </div>
        )}

        {/* Success Message */}
        {successMsg && (
          <div className="fixed top-4 right-4 z-50">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg">
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-400 mr-3" />
                <p className="text-sm font-medium text-green-800">{successMsg}</p>
              </div>
            </div>
          </div>
        )}

        {/* Create Campaign Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-6 border w-full max-w-2xl shadow-xl rounded-xl bg-white">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">{isEditing ? 'Edit Campaign' : 'Create New Campaign'}</h3>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setErrorMsg('');
                    setIsEditing(false);
                    setEditingId(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
                <form
                  className="space-y-4"
                  noValidate
                  onSubmit={(e) => {
                    e.preventDefault();
                    setErrorMsg('');
                    const startISO = combineLocalDateAndTimeToISO(form.startDateOnly, form.startTimeOnly, '09:00');
                    const endISO = combineLocalDateAndTimeToISO(form.endDateOnly, form.endTimeOnly, '18:00');
                    if (!startISO || !endISO) {
                      setErrorMsg('Invalid start or end date.');
                      return;
                    }
                    const start = new Date(startISO);
                    const end = new Date(endISO);
                    if (end <= start) {
                      setErrorMsg('End date must be after start date.');
                      return;
                    }
                    if (!form.templateId) {
                      setErrorMsg('Please select a message template.');
                      return;
                    }

                    const payload = {
                      name: form.name,
                      description: form.description || undefined,
                      targetTags: form.selectedTags,
                      templateId: form.templateId,
                      startDate: startISO,
                      endDate: endISO,
                    };
                    if (isEditing && editingId) {
                      updateMutation.mutate({ id: editingId, payload });
                    } else {
                      createMutation.mutate();
                    }
                  }}
                >
                  {errorMsg && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-3" />
                        <p className="text-sm font-medium text-red-800">{errorMsg}</p>
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Campaign Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder="Enter campaign name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
                      placeholder="Enter campaign description (optional)"
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Target Tags</label>
                    <div className="grid grid-cols-2 gap-3 max-h-40 overflow-auto border border-gray-300 rounded-lg p-4 bg-gray-50">
                      {tagsData?.map((t) => {
                        const checked = form.selectedTags.includes(t.tag);
                        return (
                          <label key={t.tag} className="flex items-center space-x-2 text-sm text-gray-700">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                              checked={checked}
                              onChange={(e) => {
                                const next = new Set(form.selectedTags);
                                if (e.target.checked) next.add(t.tag); else next.delete(t.tag);
                                setForm({ ...form, selectedTags: Array.from(next) });
                              }}
                            />
                            <span>{t.tag} <span className="text-xs text-gray-500">({t.count})</span></span>
                          </label>
                        );
                      })}
                      {(!tagsData || tagsData.length === 0) && (
                        <div className="text-xs text-gray-500 col-span-2">No tags yet. Add contacts with tags first.</div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message Template <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      value={form.templateId}
                      onChange={(e) => setForm({ ...form, templateId: e.target.value })}
                    >
                      <option value="">Select a template</option>
                      {templatesData?.templates?.map((t) => (
                        <option key={t._id} value={t._id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Start Date <span className="text-red-500">*</span></label>
                        <input
                          type="date"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                          value={form.startDateOnly}
                          onChange={(e) => setForm({ ...form, startDateOnly: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                        <input
                          type="time"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                          value={form.startTimeOnly}
                          onChange={(e) => setForm({ ...form, startTimeOnly: e.target.value })}
                          step={60}
                        />
                        <p className="mt-1 text-xs text-gray-500">Defaults to 9:00 AM if not specified</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">End Date <span className="text-red-500">*</span></label>
                        <input
                          type="date"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                          value={form.endDateOnly}
                          onChange={(e) => setForm({ ...form, endDateOnly: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                        <input
                          type="time"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                          value={form.endTimeOnly}
                          onChange={(e) => setForm({ ...form, endTimeOnly: e.target.value })}
                          step={60}
                        />
                        <p className="mt-1 text-xs text-gray-500">Defaults to 6:00 PM if not specified</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateForm(false);
                        setErrorMsg('');
                        setIsEditing(false);
                        setEditingId(null);
                      }}
                      className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      disabled={(isEditing ? updateMutation.isPending : createMutation.isPending)}
                    >
                      {(isEditing ? updateMutation.isPending : createMutation.isPending) ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {isEditing ? 'Saving...' : 'Creating...'}
                        </span>
                      ) : (
                        isEditing ? 'Save Changes' : 'Create Campaign'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
        
        )}
      </div>
    </Layout>
  );
};

export default CampaignsPage;


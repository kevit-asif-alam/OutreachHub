import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workspacesService } from '../../services/workspaces';
import { ArrowLeftIcon, UserPlusIcon, TrashIcon } from '@heroicons/react/24/outline';

const WorkspaceDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteData, setInviteData] = useState({
    email: '',
    role: 'viewer' as 'editor' | 'viewer',
    tempPassword: '',
  });
  const [error, setError] = useState('');
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState<string | null>(null);

  const { data: workspace, isLoading, error: fetchError } = useQuery({
    queryKey: ['workspace', id],
    queryFn: () => workspacesService.getById(id!),
    enabled: !!id,
  });

  const inviteUserMutation = useMutation({
    mutationFn: (data: { email: string; role: 'editor' | 'viewer'; tempPassword?: string }) =>
      workspacesService.inviteUser(id!, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workspace', id] });
      setShowInviteForm(false);
      setInviteData({ email: '', role: 'viewer', tempPassword: '' });
      setError('');
      if (data?.user?.tempPassword) {
        setInviteSuccessMsg(`User invited successfully. Temporary password: ${data.user.tempPassword}`);
      } else {
        setInviteSuccessMsg('User invited successfully. A temporary password was generated.');
      }
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to invite user');
    },
  });

  const removeUserMutation = useMutation({
    mutationFn: (userId: string) => workspacesService.removeUser(id!, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', id] });
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to remove user');
    },
  });

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInviteSuccessMsg(null);
    
    if (!inviteData.email.trim()) {
      setError('Email is required');
      return;
    }

    if (inviteData.tempPassword && inviteData.tempPassword.length > 0 && inviteData.tempPassword.length < 8) {
      setError('Temporary password must be at least 8 characters long');
      return;
    }

    inviteUserMutation.mutate({
      email: inviteData.email,
      role: inviteData.role,
      tempPassword: inviteData.tempPassword || undefined,
    });
  };

  const handleRemoveUser = (userId: string) => {
    if (window.confirm('Are you sure you want to remove this user from the workspace?')) {
      removeUserMutation.mutate(userId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (fetchError || !workspace) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-800">Error loading workspace details.</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/workspaces')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          <span>Back to Workspaces</span>
        </button>
      </div>

      <div className="space-y-6">
        {/* Workspace Info */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">{workspace.name}</h2>
            {workspace.description && (
              <p className="text-gray-600 text-sm mt-1">{workspace.description}</p>
            )}
          </div>
          <div className="px-6 py-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Created:</span>
                <span className="ml-2 text-gray-600">
                  {new Date(workspace.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Members:</span>
                <span className="ml-2 text-gray-600">{workspace.members.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Members Section */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Members</h3>
            <button
              onClick={() => setShowInviteForm(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors flex items-center space-x-2"
            >
              <UserPlusIcon className="h-5 w-5" />
              <span>Invite User</span>
            </button>
          </div>

          {showInviteForm && (
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <form onSubmit={handleInviteSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <div className="text-red-800 text-sm">{error}</div>
                  </div>
                )}
                {inviteSuccessMsg && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-3">
                    <div className="text-green-800 text-sm">{inviteSuccessMsg}</div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <input
                      type="email"
                      placeholder="Enter email address"
                      value={inviteData.email}
                      onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <select
                      value={inviteData.role}
                      onChange={(e) => setInviteData({ ...inviteData, role: e.target.value as 'editor' | 'viewer' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      placeholder="Temporary password (optional, min 8 chars)"
                      value={inviteData.tempPassword}
                      onChange={(e) => setInviteData({ ...inviteData, tempPassword: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    disabled={inviteUserMutation.isPending}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {inviteUserMutation.isPending ? 'Inviting...' : 'Send Invite'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowInviteForm(false);
                      setError('');
                      setInviteSuccessMsg(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="px-6 py-4">
            {workspace.members.length > 0 ? (
              <div className="space-y-3">
                {workspace.members.map((member, index) => {
                  const memberId = typeof member.userId === 'object' ? (member as any).userId?._id || (member as any).userId?.id : member.userId;
                  const memberEmail = typeof member.userId === 'object' ? (member as any).userId?.email : undefined;
                  const isCreator = memberId && workspace.createdBy && memberId.toString() === workspace.createdBy.toString();
                  return (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {typeof member.userId === 'object' && (member as any).userId?.email
                            ? ((member as any).userId.email as string).charAt(0).toUpperCase()
                            : 'U'}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {isCreator ? 'Self' : (memberEmail || 'Unknown User')}
                        </div>
                        <div className="text-xs text-gray-500">
                          Joined {new Date(member.joinedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        member.role === 'editor' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {member.role}
                      </span>
                      <button
                        onClick={() => handleRemoveUser(memberId)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                        title="Remove user"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )})}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No members in this workspace yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceDetails;


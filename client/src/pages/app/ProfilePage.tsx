import React, { useMemo, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import Layout from '../../components/layout/Layout';
import { profileService } from '../../services/profile';

const ProfilePage: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['profile'],
    queryFn: profileService.getProfile,
  });

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const initial = useMemo(() => (data?.email || 'U').charAt(0).toUpperCase(), [data?.email]);

  const changePasswordMutation = useMutation({
    mutationFn: () => profileService.changePassword(currentPassword, newPassword),
    onSuccess: () => {
      setMsg('Password updated successfully.');
      setErrMsg(null);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (e: any) => {
      setErrMsg(e?.response?.data?.message || 'Failed to change password');
      setMsg(null);
    },
  });

  if (isLoading) {
    return (
      <Layout title="Profile">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  if (error || !data) {
    return (
      <Layout title="Profile">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">Failed to load profile.</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Profile">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white shadow rounded-lg p-6 flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full bg-indigo-600 text-white flex items-center justify-center text-2xl font-semibold">
            {initial}
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900">{data.email}</div>
            {data.workspace && (
              <div className="text-sm text-gray-600">
                {data.workspace.name} — ID: {data.workspace.workspaceId}
              </div>
            )}
            {data.role && (
              <div className="mt-1"><span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">{data.role}</span></div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="bg-white shadow rounded-lg p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={data.email} disabled className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Workspace</label>
              <input type="text" value={data.workspace?.name || ''} disabled className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Workspace ID</label>
              <input type="text" value={data.workspace?.workspaceId || ''} disabled className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <input type="text" value={data.role || ''} disabled className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-600" />
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
          {msg && (<div className="mb-3 bg-green-50 border border-green-200 rounded-md p-3 text-sm text-green-800">{msg}</div>)}
          {errMsg && (<div className="mb-3 bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-800">{errMsg}</div>)}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (newPassword !== confirmPassword) {
                setErrMsg('New password and confirm password do not match');
                setMsg(null);
                return;
              }
              changePasswordMutation.mutate();
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
              </div>
            </div>
            <div className="flex items-center justify-end">
              <button type="submit" disabled={changePasswordMutation.isPending} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50">
                {changePasswordMutation.isPending ? 'Saving...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;

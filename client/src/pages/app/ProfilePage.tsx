import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../../components/layout/Layout';
import { UserIcon, EnvelopeIcon, BuildingOfficeIcon, CalendarIcon } from '@heroicons/react/24/outline';

const ProfilePage: React.FC = () => {
  const { user, currentWorkspace } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    email: user?.email || '',
    firstName: '',
    lastName: '',
    phone: '',
  });

  const handleSave = () => {
    // TODO: Implement profile update logic
    setIsEditing(false);
  };

  return (
    <Layout title="Profile">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-6">
            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center">
              <UserIcon className="h-10 w-10 text-indigo-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">
                {user?.email || 'User Profile'}
              </h2>
              <p className="text-gray-600">
                {currentWorkspace?.name || 'Workspace'} • {currentWorkspace?.role || 'User'}
              </p>
              <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  Member since {new Date().toLocaleDateString()}
                </div>
                <div className="flex items-center">
                  <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                  Workspace ID: {currentWorkspace?.workspaceId.slice(-8)}
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>
        </div>

        {/* Profile Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-left text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="flex items-center space-x-3">
                  {/* <EnvelopeIcon className="h-5 w-5 text-gray-400" /> */}
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!isEditing}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-left text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <label className="block text-left text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-left text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            {isEditing && (
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            )}
          </div>

          {/* Workspace Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Workspace Information</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Workspace Name</p>
                  <p className="text-sm text-gray-600">{currentWorkspace?.name || 'Default Workspace'}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  currentWorkspace?.role === 'editor' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {currentWorkspace?.role || 'viewer'}
                </span>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium text-left text-gray-900 mb-1">Workspace ID</p>
                <p className="text-sm text-left text-gray-600 font-mono">{currentWorkspace?.workspaceId}</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium text-left text-gray-900 mb-1">Joined Date</p>
                <p className="text-sm text-left text-gray-600">
                  {currentWorkspace?.joinedAt ? new Date(currentWorkspace.joinedAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>

            {/* <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Need to switch workspaces?</h4>
              <p className="text-sm text-blue-700 mb-3">
                Contact your administrator to be added to additional workspaces or to change your role.
              </p>
              <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                Contact Administrator →
              </button>
            </div> */}
          </div>
        </div>

        {/* Account Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Settings</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div>
                <p className="font-medium text-gray-900">Change Password</p>
                <p className="text-sm text-gray-600">Update your account password</p>
              </div>
              <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                Change
              </button>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div>
                <p className="font-medium text-gray-900">Notification Preferences</p>
                <p className="text-sm text-gray-600">Manage your notification settings</p>
              </div>
              <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                Manage
              </button>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-red-900">Delete Account</p>
                <p className="text-sm text-red-600">Permanently delete your account and all data</p>
              </div>
              <button className="px-4 py-2 border border-red-300 rounded-lg text-red-700 hover:bg-red-50 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;
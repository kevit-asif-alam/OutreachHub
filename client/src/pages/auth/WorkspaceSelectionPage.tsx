import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { EyeIcon, UserIcon } from '@heroicons/react/24/outline';

const WorkspaceSelectionPage: React.FC = () => {
  const { user, selectWorkspace } = useAuth();
  const navigate = useNavigate();

  const handleWorkspaceSelect = async (workspace: any) => {
    await selectWorkspace(workspace);
    navigate('/dashboard');
  };

  const isAdminSelectingWorkspace = user?.isAdmin;

  if (!user?.workspaces?.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">No Workspaces Available</h1>
          <p className="text-gray-600">You don't have access to any workspaces yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-indigo-100">
            <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isAdminSelectingWorkspace ? 'Select Workspace to View' : 'Select Workspace'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isAdminSelectingWorkspace 
              ? 'Choose a workspace to view as an admin' 
              : 'Choose a workspace to continue'
            }
          </p>
          {isAdminSelectingWorkspace && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center">
                <EyeIcon className="h-5 w-5 text-blue-600 mr-2" />
                <p className="text-sm text-blue-800">
                  <strong>Admin Mode:</strong> You'll be able to view this workspace while maintaining admin privileges.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {user.workspaces.map((workspace) => (
            <div
              key={workspace.workspaceId}
              className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:border-indigo-300 transition-colors cursor-pointer"
              onClick={() => handleWorkspaceSelect(workspace)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {workspace.name || 'Workspace'} ({workspace.workspaceId.slice(-8)})
                    </h3>
                    {isAdminSelectingWorkspace && (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        <EyeIcon className="h-3 w-3 mr-1" />
                        Admin View
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 capitalize">
                    Role: {workspace.role}
                  </p>
                  <p className="text-xs text-gray-500">
                    Joined: {new Date(workspace.joinedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    workspace.role === 'editor' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {workspace.role}
                  </span>
                  {isAdminSelectingWorkspace && (
                    <div className="text-right">
                      <p className="text-xs text-blue-600 font-medium">Click to view</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don't see your workspace? Contact your administrator.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceSelectionPage;



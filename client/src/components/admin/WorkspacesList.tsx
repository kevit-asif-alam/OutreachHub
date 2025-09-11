import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { workspacesService } from '../../services/workspaces';
import { PlusIcon, UsersIcon, CalendarIcon } from '@heroicons/react/24/outline';

const WorkspacesList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: workspaces, isLoading, error } = useQuery({
    queryKey: ['workspaces'],
    queryFn: workspacesService.getAll,
  });

  const filteredWorkspaces = workspaces?.filter(workspace =>
    workspace.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workspace.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-800">Error loading workspaces. Please try again.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Workspaces</h2>
          <p className="text-gray-600">Manage your business workspaces and users</p>
        </div>
        <Link
          to="/admin/workspaces/create"
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors flex items-center space-x-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Create Workspace</span>
        </Link>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <input
          type="text"
          placeholder="Search workspaces..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Workspaces Grid */}
      {filteredWorkspaces && filteredWorkspaces.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredWorkspaces.map((workspace) => (
            <div key={workspace._id} className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {workspace.name}
                    </h3>
                    {workspace.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {workspace.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                  <div className="flex items-center space-x-1">
                    <UsersIcon className="icon-sm" />
                    <span>{workspace.members.length} members</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <CalendarIcon className="icon-sm" />
                    <span>{new Date(workspace.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Link
                    to={`/admin/workspaces/${workspace._id}`}
                    className="flex-1 bg-indigo-600 text-white text-center py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium"
                  >
                    Manage
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-500">
            {searchTerm ? 'No workspaces found matching your search.' : 'No workspaces created yet.'}
          </div>
          {!searchTerm && (
            <Link
              to="/admin/workspaces/create"
              className="mt-4 inline-block bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
            >
              Create your first workspace
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkspacesList;
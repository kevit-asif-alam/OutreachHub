import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { messageTemplatesService } from '../../services/messageTemplates';
import Layout from '../../components/layout/Layout';
import { PlusIcon, MagnifyingGlassIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

const MessageTemplatesPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    content: '',
    type: 'text' as 'text' | 'text_and_image',
    imageUrl: '',
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ name: '', content: '', imageUrl: '' });
  const queryClient = useQueryClient();
  const { currentWorkspace } = useAuth();
  const isViewer = currentWorkspace?.role === 'viewer';

  const { data: templatesData, isLoading, error } = useQuery({
    queryKey: ['message-templates', page, searchTerm],
    queryFn: () => messageTemplatesService.getAll(page, 10, searchTerm),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      messageTemplatesService.create({
        name: form.name,
        content: form.content,
        type: form.type,
        imageUrl: form.type === 'text_and_image' ? form.imageUrl || undefined : undefined,
      }),
    onSuccess: () => {
      setShowCreateForm(false);
      setForm({ name: '', content: '', type: 'text', imageUrl: '' });
      setErrorMsg('');
      setFieldErrors({ name: '', content: '', imageUrl: '' });
      setSuccessMsg('Template created successfully!');
      queryClient.invalidateQueries({ queryKey: ['message-templates'] });
      setTimeout(() => setSuccessMsg(''), 3000);
    },
    onError: (err: any) => {
      setErrorMsg(err?.response?.data?.message || 'Failed to create template');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => messageTemplatesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-templates'] });
    },
  });

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <Layout title="Message Templates">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Message Templates">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">Error loading templates. Please try again.</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Message Templates">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Message Templates</h2>
            <p className="text-gray-600">Create and manage your message templates</p>
          </div>
          {!isViewer && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors flex items-center space-x-2"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Create Template</span>
          </button>
          )}
        </div>

        {/* Search */}
        <div className="max-w-md">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Templates List */}
        {templatesData && templatesData.templates.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {templatesData.templates.map((template) => (
              <div key={template._id} className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      template.type === 'text' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {template.type === 'text' ? 'Text' : 'Text + Image'}
                    </span>
                  </div>
                  
                  <div className="relative">
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3 overflow-hidden">
                      {template.content}
                    </p>
                    {template.content.length > 150 && (
                      <div className="absolute bottom-0 right-0 bg-white pl-2 text-xs text-gray-400">
                        ...
                      </div>
                    )}
                  </div>
                  
                  {template.imageUrl && (
                    <div className="mb-4">
                      <img 
                        src={template.imageUrl} 
                        alt="Template preview" 
                        className="w-full h-32 object-cover rounded-md"
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      Created {new Date(template.createdAt).toLocaleDateString()}
                    </div>
                    {!isViewer && (
                    <button
                      className="text-red-600 hover:text-red-800 text-xs"
                      onClick={() => handleDelete(template._id)}
                    >
                      Delete
                    </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500">
              {searchTerm ? 'No templates found matching your search.' : 'No templates created yet.'}
            </div>
            {!isViewer && !searchTerm && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
              >
                Create your first template
              </button>
            )}
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

        {/* Create Template Form Modal */}
        {showCreateForm && !isViewer && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-6 border w-full max-w-lg shadow-xl rounded-xl bg-white">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Create New Template</h3>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setErrorMsg('');
                    setFieldErrors({ name: '', content: '', imageUrl: '' });
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form className="space-y-5" onSubmit={(e) => { 
                e.preventDefault(); 
                createMutation.mutate(); 
              }}>
                {errorMsg && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-3" />
                      <p className="text-sm font-medium text-red-800">{errorMsg}</p>
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-left text-sm font-medium text-gray-700 mb-2">
                    Template Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    placeholder="Enter template name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-left text-sm font-medium text-gray-700 mb-2">
                    Template Type
                  </label>
                  <select
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as 'text' | 'text_and_image' })}
                  >
                    <option value="text">Text Only</option>
                    <option value="text_and_image">Text + Image</option>
                  </select>
                </div>

                <div>
                  <label className="block text-left text-sm font-medium text-gray-700 mb-2">
                    Message Content <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={5}
                    maxLength={1000}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
                    placeholder="Enter your message template.."
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {form.content.length}/1000 characters
                  </p>
                </div>

                <div>
                  <label className="block text-left text-sm font-medium text-gray-700 mb-2">
                    Image URL
                    {form.type === 'text_and_image' && <span className="text-red-500"> *</span>}
                  </label>
                  <input
                    type="url"
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                      form.type === 'text' ? 'bg-gray-50 text-gray-500' : ''
                    }`}
                    placeholder={form.type === 'text' ? 'Select Text + Image type to enable' : 'Enter image URL'}
                    value={form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    disabled={form.type === 'text'}
                    required={form.type === 'text_and_image'}
                  />
                  {form.type === 'text_and_image' && (
                    <p className="mt-1 text-xs text-gray-500">
                      Provide a publicly accessible image URL
                    </p>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setErrorMsg('');
                      setFieldErrors({ name: '', content: '', imageUrl: '' });
                    }}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {createMutation.isPending ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating...
                      </span>
                    ) : (
                      'Create Template'
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

export default MessageTemplatesPage;


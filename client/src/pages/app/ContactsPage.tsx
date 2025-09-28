import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { contactsService } from '../../services/contacts';
import Layout from '../../components/layout/Layout';
import { PlusIcon, MagnifyingGlassIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

const ContactsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    tags: '',
  });
  const [editForm, setEditForm] = useState({
    _id: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    tags: '',
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ firstName: '', lastName: '', phoneNumber: '', email: '' });
  const queryClient = useQueryClient();
  const { currentWorkspace } = useAuth();
  const isViewer = currentWorkspace?.role === 'viewer';

  const { data: contactsData, isLoading, error } = useQuery({
    queryKey: ['contacts', page, searchTerm],
    queryFn: () => contactsService.getAll(page, 10, searchTerm),
  });

  // Enhanced validation
  const validateContactForm = (data: typeof form) => {
    const errors = { firstName: '', lastName: '', phoneNumber: '', email: '' };
    let hasErrors = false;

    if (!data.firstName.trim()) {
      errors.firstName = 'First name is required';
      hasErrors = true;
    }

    if (!data.lastName.trim()) {
      errors.lastName = 'Last name is required';
      hasErrors = true;
    }

    if (!data.phoneNumber.trim()) {
      errors.phoneNumber = 'Phone number is required';
      hasErrors = true;
    } else if (!/^\d{10}$/.test(data.phoneNumber.trim())) {
      errors.phoneNumber = 'Please enter a valid phone number';
      hasErrors = true;
    }

    if (data.email && !/\S+@\S+\.\S+/.test(data.email)) {
      errors.email = 'Please enter a valid email address';
      hasErrors = true;
    }

    setFieldErrors(errors);
    return !hasErrors;
  };

  const createMutation = useMutation({
    mutationFn: () =>
      contactsService.create({
        firstName: form.firstName,
        lastName: form.lastName,
        phoneNumber: form.phoneNumber,
        email: form.email || undefined,
        tags: form.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      }),
    onSuccess: () => {
      setShowCreateForm(false);
      setForm({ firstName: '', lastName: '', phoneNumber: '', email: '', tags: '' });
      setErrorMsg('');
      setFieldErrors({ firstName: '', lastName: '', phoneNumber: '', email: '' });
      setSuccessMsg('Contact created successfully!');
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMsg(''), 3000);
    },
    onError: (err: any) => {
      setErrorMsg(err?.response?.data?.message || 'Failed to create contact');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => contactsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: {
      id: string;
      data: {
        firstName?: string;
        lastName?: string;
        phoneNumber?: string;
        email?: string;
        tags?: string[];
      };
    }) => contactsService.update(payload.id, payload.data),
    onSuccess: () => {
      setShowEditForm(false);
      setEditForm({ _id: '', firstName: '', lastName: '', phoneNumber: '', email: '', tags: '' });
      setErrorMsg('');
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
    onError: (err: any) => {
      setErrorMsg(err?.response?.data?.message || 'Failed to update contact');
    },
  });

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <Layout title="Contacts">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Contacts">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">Error loading contacts. Please try again.</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Contacts">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Contacts</h2>
            <p className="text-gray-600">Manage your contact list and tags</p>
          </div>
          {!isViewer && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors flex items-center space-x-2"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Add Contact</span>
          </button>
          )}

        {/* Edit Contact Form Modal */}
        {showEditForm && !isViewer && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-purple-200">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Contact</h3>
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    updateMutation.mutate({
                      id: editForm._id,
                      data: {
                        firstName: editForm.firstName,
                        lastName: editForm.lastName,
                        phoneNumber: editForm.phoneNumber,
                        email: editForm.email || undefined,
                        tags: editForm.tags
                          .split(',')
                          .map((t) => t.trim())
                          .filter(Boolean),
                      },
                    });
                  }}
                >
                  {errorMsg && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-800">{errorMsg}</div>
                  )}
                  <div>
                    <label className="block text-left text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={editForm.firstName}
                      onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-left text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={editForm.lastName}
                      onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-left text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={editForm.phoneNumber}
                      onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-left text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
                    <input
                      type="email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-left text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={editForm.tags}
                      onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowEditForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                      {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
        </div>

        {/* Search */}
        <div className="max-w-md">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Contacts List */}
        {contactsData && contactsData.contacts.length > 0 ? (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {contactsData.pagination.total} contacts found
              </h3>
            </div>
            <div className="divide-y divide-gray-200">
              {contactsData.contacts.map((contact) => (
                <div key={contact._id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {contact.firstName.charAt(0)}{contact.lastName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {contact.firstName} {contact.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {contact.phoneNumber}
                          {contact.email && ` • ${contact.email}`}
                        </div>
                        {contact.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {contact.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-xs text-gray-500">Added {new Date(contact.createdAt).toLocaleDateString()}</div>
                      {!isViewer && (
                        <button
                          onClick={() => {
                            setEditForm({
                              _id: contact._id,
                              firstName: contact.firstName,
                              lastName: contact.lastName,
                              phoneNumber: contact.phoneNumber,
                              email: contact.email || '',
                              tags: (contact.tags || []).join(', '),
                            });
                            setErrorMsg('');
                            setShowEditForm(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-800 text-xs"
                        >
                          Edit
                        </button>
                      )}
                      {!isViewer && (
                      <button
                        onClick={() => handleDelete(contact._id)}
                        className="text-red-600 hover:text-red-800 text-xs"
                      >
                        Delete
                      </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {contactsData.pagination.pages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
                  <div className="text-sm text-gray-700">
                    Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, contactsData.pagination.total)} of {contactsData.pagination.total} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    >
                      Previous
                    </button>
                    
                    {/* Page Numbers */}
                    <div className="flex space-x-1">
                      {Array.from({ length: Math.min(5, contactsData.pagination.pages) }, (_, i) => {
                        let pageNum;
                        if (contactsData.pagination.pages <= 5) {
                          pageNum = i + 1;
                        } else if (page <= 3) {
                          pageNum = i + 1;
                        } else if (page >= contactsData.pagination.pages - 2) {
                          pageNum = contactsData.pagination.pages - 4 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setPage(pageNum)}
                            className={`px-3 py-1 text-sm rounded-md transition-colors ${
                              page === pageNum
                                ? 'bg-indigo-600 text-white'
                                : 'border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page === contactsData.pagination.pages}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500">
              {searchTerm ? 'No contacts found matching your search.' : 'No contacts added yet.'}
            </div>
            {!isViewer && !searchTerm && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
              >
                Add your first contact
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

        {/* Create Contact Form Modal */}
        {showCreateForm && !isViewer && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-6 border w-full max-w-md shadow-xl rounded-xl bg-white">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Add New Contact</h3>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setErrorMsg('');
                    setFieldErrors({ firstName: '', lastName: '', phoneNumber: '', email: '' });
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
                if (validateContactForm(form)) {
                  createMutation.mutate(); 
                }
              }}>
                {errorMsg && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-3" />
                      <p className="text-sm font-medium text-red-800">{errorMsg}</p>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-left text-sm font-medium text-gray-700 mb-2">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors ${
                        fieldErrors.firstName 
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                          : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                      }`}
                      placeholder="Enter first name"
                      value={form.firstName}
                      onChange={(e) => {
                        setForm({ ...form, firstName: e.target.value });
                        if (fieldErrors.firstName) {
                          setFieldErrors(prev => ({ ...prev, firstName: '' }));
                        }
                      }}
                    />
                    {fieldErrors.firstName && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                        {fieldErrors.firstName}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-left text-sm font-medium text-gray-700 mb-2">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors ${
                        fieldErrors.lastName 
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                          : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                      }`}
                      placeholder="Enter last name"
                      value={form.lastName}
                      onChange={(e) => {
                        setForm({ ...form, lastName: e.target.value });
                        if (fieldErrors.lastName) {
                          setFieldErrors(prev => ({ ...prev, lastName: '' }));
                        }
                      }}
                    />
                    {fieldErrors.lastName && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                        {fieldErrors.lastName}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-left text-sm font-medium text-gray-700 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors ${
                      fieldErrors.phoneNumber 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                    }`}
                    placeholder="Enter phone number"
                    value={form.phoneNumber}
                    onChange={(e) => {
                      setForm({ ...form, phoneNumber: e.target.value });
                      if (fieldErrors.phoneNumber) {
                        setFieldErrors(prev => ({ ...prev, phoneNumber: '' }));
                      }
                    }}
                  />
                  {fieldErrors.phoneNumber && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      {fieldErrors.phoneNumber}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-left text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors ${
                      fieldErrors.email 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                    }`}
                    placeholder="Enter email address (optional)"
                    value={form.email}
                    onChange={(e) => {
                      setForm({ ...form, email: e.target.value });
                      if (fieldErrors.email) {
                        setFieldErrors(prev => ({ ...prev, email: '' }));
                      }
                    }}
                  />
                  {fieldErrors.email && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      {fieldErrors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-left text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    placeholder="e.g., vip, customer, newsletter (comma-separated)"
                    value={form.tags}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  />
                  {/* <p className="mt-1 text-xs text-gray-500">Separate multiple tags with commas</p> */}
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setErrorMsg('');
                      setFieldErrors({ firstName: '', lastName: '', phoneNumber: '', email: '' });
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
                        Adding...
                      </span>
                    ) : (
                      'Add Contact'
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

export default ContactsPage;


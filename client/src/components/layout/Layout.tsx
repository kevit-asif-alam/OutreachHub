import React, { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeftIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
  children: ReactNode;
  title: string;
  isAdmin?: boolean;
}

const ProfileMenu: React.FC<{ userEmail: string; onProfile: () => void; onLogout: () => void }> = ({ userEmail, onProfile, onLogout }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initial = (userEmail || 'U').charAt(0).toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
        title={userEmail}
      >
        {initial}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-md shadow-lg z-50">
          <div className="px-3 py-2 text-xs text-gray-500 border-b truncate" title={userEmail}>{userEmail}</div>
          <button
            onClick={() => { setOpen(false); onProfile(); }}
            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
          >
            Profile
          </button>
          <button
            onClick={() => { setOpen(false); onLogout(); }}
            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

const Layout: React.FC<LayoutProps> = ({ children, title, isAdmin = false }) => {
  const { user, logout, currentWorkspace } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Check if admin is viewing a user workspace
  const isAdminViewingUserWorkspace = user?.isAdmin && !isAdmin && currentWorkspace;

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navigation = isAdmin ? [
    { name: 'Dashboard', href: '/admin', current: location.pathname === '/admin' },
    { name: 'Workspaces', href: '/admin/workspaces', current: location.pathname.startsWith('/admin/workspaces') },
  ] : [
    { name: 'Dashboard', href: '/dashboard', current: location.pathname === '/dashboard' },
    { name: 'Contacts', href: '/contacts', current: location.pathname === '/contacts' },
    { name: 'Templates', href: '/templates', current: location.pathname === '/templates' },
    { name: 'Campaigns', href: '/campaigns', current: location.pathname === '/campaigns' },
  ];

  // For admin pages, use the old layout
  if (isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Admin Workspace View Indicator */}
        {isAdminViewingUserWorkspace && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center space-x-3">
                  <ShieldCheckIcon className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      Admin View Mode
                    </p>
                    <p className="text-xs text-blue-700">
                      You are viewing workspace: <span className="font-semibold">{currentWorkspace.name || 'Workspace'}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/admin')}
                  className="inline-flex items-center px-3 py-2 border border-blue-300 shadow-sm text-sm leading-4 font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <ArrowLeftIcon className="h-4 w-4 mr-1" />
                  Return to Admin Dashboard
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Admin Navigation */}
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <Link to="/admin" className="text-2xl font-bold text-indigo-600">
                    OutreachHub
                  </Link>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`${
                        item.current
                          ? 'border-indigo-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                    >
                      <span className="align-middle">{item.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleLogout}
                  className="bg-gray-100 text-gray-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Page Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {children}
          </div>
        </main>
      </div>
    );
  }

  // For user pages, use the new sidebar layout
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex">
        <Sidebar isCollapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={toggleMobileSidebar}></div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <Sidebar isCollapsed={false} onToggle={toggleMobileSidebar} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <Header 
          title={title} 
          showSidebarToggle={true} 
          onSidebarToggle={toggleMobileSidebar} 
        />

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;



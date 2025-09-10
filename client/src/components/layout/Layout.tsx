import React, { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to={isAdmin ? "/admin" : "/dashboard"} className="text-2xl font-bold text-indigo-600">
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
              {!isAdmin && currentWorkspace && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Workspace:</span> {currentWorkspace.name || 'Workspace'} ({currentWorkspace.workspaceId.slice(-8)})
                  <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                    currentWorkspace.role === 'editor' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {currentWorkspace.role}
                  </span>
                </div>
              )}
              {/* Profile Dropdown (app users only) */}
              {!isAdmin ? (
                <ProfileMenu userEmail={user?.email || ''} onLogout={handleLogout} onProfile={() => navigate('/profile')} />
              ) : (
                <button
                  onClick={handleLogout}
                  className="bg-gray-100 text-gray-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  Logout
                </button>
              )}
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
};

export default Layout;



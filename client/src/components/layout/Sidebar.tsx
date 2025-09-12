import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  HomeIcon, 
  UserGroupIcon, 
  DocumentTextIcon, 
  MegaphoneIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserIcon,
  CogIcon
} from '@heroicons/react/24/outline';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const location = useLocation();
  const { user, currentWorkspace } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Contacts', href: '/contacts', icon: UserGroupIcon },
    { name: 'Templates', href: '/templates', icon: DocumentTextIcon },
    { name: 'Campaigns', href: '/campaigns', icon: MegaphoneIcon },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <div className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (
          <Link to="/dashboard" className="text-xl font-bold text-indigo-600">
            OutreachHub
          </Link>
        )}
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRightIcon className="h-5 w-5 text-gray-600" />
          ) : (
            <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
          )}
        </button>
      </div>

      {/* User Info */}
      {!isCollapsed && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <UserIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.email || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {currentWorkspace?.name || 'Workspace'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActive(item.href)
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
              title={isCollapsed ? item.name : undefined}
            >
              <Icon className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'} flex-shrink-0`} />
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <Link
          to="/profile"
          className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors ${
            isActive('/profile') ? 'bg-indigo-100 text-indigo-700' : ''
          }`}
          title={isCollapsed ? 'Profile' : undefined}
        >
          <CogIcon className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'} flex-shrink-0`} />
          {!isCollapsed && <span>Profile</span>}
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;

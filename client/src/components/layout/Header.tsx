import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  ArrowRightIcon,
  Bars3Icon,
  UserIcon,
} from "@heroicons/react/24/outline";

interface HeaderProps {
  title: string;
  showSidebarToggle?: boolean;
  onSidebarToggle?: () => void;
}

const ProfileMenu: React.FC<{
  userEmail: string;
  onProfile: () => void;
  onLogout: () => void;
}> = ({ userEmail, onProfile, onLogout }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initial = (userEmail || "U").charAt(0).toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-purple-200 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold text-sm">
          {initial}
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-sm font-medium text-gray-900">{userEmail}</p>
          <p className="text-xs text-gray-500">User</p>
        </div>
      </button>

      {open && (
        <div className="backdrop-blur absolute right-0 mt-2 w-56 bg-purple-200 border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">{userEmail}</p>
          </div>

          <div className="py-1">
            <button
              onClick={() => {
                setOpen(false);
                onProfile();
              }}
              className="w-full flex items-center px-4 py-2 text-sm text-black-700 hover:bg-red-400 transition-colors"
            >
              <UserIcon className="h-4 w-4 mr-3" />
              Profile
            </button>

            <button
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="w-full flex items-center px-4 py-2 text-sm text-black-600 hover:bg-red-400 transition-colors"
            >
              <ArrowRightIcon className="h-4 w-4 mr-3" />
              Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const Header: React.FC<HeaderProps> = ({
  title,
  showSidebarToggle = false,
  onSidebarToggle,
}) => {
  const { user, logout, currentWorkspace } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header className="bg-purple-100 border-b border-black-200 sticky top-0 z-40">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Left side */}
        <div className="flex items-center space-x-2">
          {showSidebarToggle && onSidebarToggle && (
            <button
              onClick={onSidebarToggle}
              className="p-2 rounded-lg hover:bg-purple-200 transition-colors"
              title="Toggle sidebar"
            >
              {/* <svg
                className="h-6 w-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg> */}
              <Bars3Icon className="h-6 w-6" />
            </button>
          )}

          <div>
            <h1 className="text-xl font-semibold text-black-900">{title}</h1>
            {currentWorkspace && (
              <p className="text-sm text-black-500">
                {currentWorkspace.name || "Workspace"} (
                {currentWorkspace.workspaceId.slice(-8)})
              </p>
            )}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Profile Menu */}
          <ProfileMenu
            userEmail={user?.email || ""}
            onLogout={handleLogout}
            onProfile={() => navigate("/profile")}
          />
        </div>
      </div>
    </header>
  );
};

export default Header;

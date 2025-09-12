import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import WorkspacesPage from './WorkspacesPage';

const AdminDashboard: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin/workspaces" replace />} />
      <Route path="/workspaces/*" element={<WorkspacesPage />} />
    </Routes>
  );
};

export default AdminDashboard;



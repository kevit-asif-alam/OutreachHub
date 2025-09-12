import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import WorkspacesList from '../../components/admin/WorkspacesList';
import WorkspaceDetails from '../../components/admin/WorkspaceDetails';
import CreateWorkspace from '../../components/admin/CreateWorkspace';

const WorkspacesPage: React.FC = () => {
  return (
    <Layout title="Workspace Management" isAdmin={true}>
      <Routes>
        <Route path="/" element={<WorkspacesList />} />
        <Route path="/create" element={<CreateWorkspace />} />
        <Route path="/:id" element={<WorkspaceDetails />} />
      </Routes>
    </Layout>
  );
};

export default WorkspacesPage;



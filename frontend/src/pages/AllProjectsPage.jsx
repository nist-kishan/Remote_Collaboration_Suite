import React from 'react';
import PageLayout from '../components/ui/PageLayout';
import AllProjectsList from '../components/project/AllProjectsList';

const AllProjectsPage = () => {
  return (
    <PageLayout 
      title="All Projects"
      subtitle="View and manage all your projects across workspaces"
    >
      <AllProjectsList />
    </PageLayout>
  );
};

export default AllProjectsPage;

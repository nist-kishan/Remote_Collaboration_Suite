import React from 'react';
import PageLayoutWrapper from '../components/ui/PageLayoutWrapper';
import ProjectListGrid from '../components/project/ProjectListGrid';

const AllProjectsPage = () => {
  return (
    <PageLayoutWrapper 
      title="All Projects"
      subtitle="View and manage all your projects across workspaces"
    >
      <ProjectListGrid />
    </PageLayoutWrapper>
  );
};

export default AllProjectsPage;

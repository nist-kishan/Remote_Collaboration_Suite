import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Plus, 
  Users, 
  Settings, 
  Calendar, 
  MessageSquare, 
  BarChart3,
  FolderOpen,
  MoreVertical,
  Search
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { workspaceApi } from '../../api/workspaceApi';
import { projectApi } from '../../api/projectApi';
import PageLayoutWrapper from '../../components/ui/PageLayoutWrapper';
import CustomCard from '../../components/ui/CustomCard';
import CustomButton from '../../components/ui/CustomButton';
import ProjectList from '../../components/project/ProjectList';
import ProjectCreator from '../../components/project/ProjectCreator';

const WorkspacePage = () => {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('projects');
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch workspace
  const { data: workspaceData, isLoading: workspaceLoading, error: workspaceError } = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: () => workspaceApi.getWorkspace(workspaceId),
    enabled: !!workspaceId
  });

  // Fetch workspace projects
  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ['workspace-projects', workspaceId],
    queryFn: () => projectApi.getWorkspaceProjects(workspaceId),
    enabled: !!workspaceId
  });

  const workspace = workspaceData?.data?.data?.workspace;
  const projects = projectsData?.data?.data?.projects || [];

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs = [
    { id: 'projects', label: 'Projects', icon: FolderOpen, count: projects.length },
    { id: 'members', label: 'Members', icon: Users, count: workspace?.memberCount || 0 },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  if (workspaceLoading) {
    return (
      <PageLayoutWrapper title="Loading..." subtitle="Please wait">
        <div className="space-y-6">
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>
      </PageLayoutWrapper>
    );
  }

  if (workspaceError || !workspace) {
    return (
      <PageLayoutWrapper title="Workspace Not Found" subtitle="The workspace you're looking for doesn't exist">
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">Failed to load workspace</p>
          <CustomButton onClick={() => navigate('/dashboard')}>Go to Dashboard</CustomButton>
        </div>
      </PageLayoutWrapper>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'projects':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <CustomButton onClick={() => setShowCreateProject(true)} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create Project
              </CustomButton>
            </div>

            <ProjectList 
              projects={filteredProjects} 
              isLoading={projectsLoading}
              workspaceId={workspaceId}
            />
          </div>
        );

      case 'members':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Workspace Members
              </h3>
              <CustomButton variant="outline" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Invite Members
              </CustomButton>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workspace.members.map((member) => (
                <CustomCard key={member.user._id} className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                      <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                        {member.user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {member.user.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {member.user.email}
                      </p>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                        member.role === 'owner' 
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                          : member.role === 'admin'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                      }`}>
                        {member.role}
                      </span>
                    </div>
                    <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </CustomCard>
              ))}
            </div>
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Workspace Analytics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <CustomCard className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <FolderOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Projects</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {projects.length}
                    </p>
                  </div>
                </div>
              </CustomCard>

              <CustomCard className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Members</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {workspace.memberCount}
                    </p>
                  </div>
                </div>
              </CustomCard>

              <CustomCard className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Active Projects</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {projects.filter(p => p.status === 'active').length}
                    </p>
                  </div>
                </div>
              </CustomCard>

              <CustomCard className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">This Month</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {projects.filter(p => {
                        const created = new Date(p.createdAt);
                        const now = new Date();
                        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
                      }).length}
                    </p>
                  </div>
                </div>
              </CustomCard>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Workspace Settings
            </h3>
            <CustomCard className="p-6">
              <p className="text-gray-600 dark:text-gray-400">
                Settings panel will be implemented here
              </p>
            </CustomCard>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <PageLayoutWrapper 
      title={workspace.name}
      subtitle={workspace.description || 'Workspace management and collaboration'}
    >
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 py-0.5 px-2 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {renderTabContent()}
      </div>

      {/* Modals */}
      <ProjectCreator
        isOpen={showCreateProject}
        onClose={() => setShowCreateProject(false)}
        workspaceId={workspaceId}
      />
      </PageLayoutWrapper>
  );
};

export default WorkspacePage;

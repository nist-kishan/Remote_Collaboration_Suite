import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Settings,
  Users,
  Calendar,
  BarChart3,
  MoreVertical,
  FileText,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import { projectApi } from "../../api/projectApi";
import PageLayoutWrapper from "../../components/ui/PageLayoutWrapper";
import CustomCard from "../../components/ui/CustomCard";
import CustomButton from "../../components/ui/CustomButton";
import ProjectKanbanBoard from "../../components/kanban/ProjectKanbanBoard";
import ProjectDashboard from "../../components/project/ProjectDashboard";
import ProjectMemberList from "../../components/project/ProjectMemberList";
import ProjectMeetingList from "../../components/project/ProjectMeetingList";
import ProjectSettings from "../../components/project/ProjectSettings";
import ProjectBudget from "../../components/project/ProjectBudget";
import ProjectDocuments from "../../components/project/ProjectDocuments";
import ProjectEditModal from "../../components/project/ProjectEditModal";
import BudgetRequestList from "../../components/project/BudgetRequestList";
import { useSelector } from "react-redux";
import { canPerformProjectAction } from "../../utils/roleUtils";

const ProjectPage = () => {
  const { workspaceId, projectId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [showEditModal, setShowEditModal] = useState(false);
  const currentUser = useSelector((state) => state.auth.user);

  // Fetch project
  const {
    data: projectData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => {
      return projectApi.getProject(projectId);
    },
    enabled: !!projectId && projectId !== ':projectId',
  });

  const project = projectData?.data?.data?.project;

  // Get user permissions
  const canEdit = canPerformProjectAction(project, currentUser, 'canEdit');
  const canDelete = canPerformProjectAction(project, currentUser, 'canDelete');
  const canManageMembers = canPerformProjectAction(project, currentUser, 'canManageMembers');
  const canChangeSettings = canPerformProjectAction(project, currentUser, 'canChangeSettings');
  const canManageCollaborators = canPerformProjectAction(project, currentUser, 'canManageCollaborators');

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3, show: true },
    { id: "board", label: "Kanban Board", icon: Settings, show: true },
    { id: "members", label: "Members", icon: Users, show: true },
    { id: "meetings", label: "Meetings", icon: Calendar, show: true },
    { id: "documents", label: "Documents", icon: FileText, show: true },
    { id: "budget-requests", label: "Budget Requests", icon: DollarSign, show: true },
    { id: "settings", label: "Settings", icon: Settings, show: canChangeSettings },
  ].filter(tab => tab.show);

  if (isLoading) {
    return (
      <PageLayoutWrapper title="Loading..." subtitle="Please wait">
        <div className="space-y-6">
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
              ></div>
            ))}
          </div>
        </div>
      </PageLayoutWrapper>
    );
  }

  if (error || !project) {
    return (
      <PageLayoutWrapper
        title="Project Not Found"
        subtitle="The project you're looking for doesn't exist"
      >
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">Failed to load project</p>
          <CustomButton onClick={() => navigate(`/workspace/${workspaceId}`)}>
            Back to Workspace
          </CustomButton>
        </div>
      </PageLayoutWrapper>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-4 sm:space-y-6">
            <ProjectDashboard project={project} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <ProjectBudget project={project} />
            </div>
          </div>
        );

      case "board":
        return <ProjectKanbanBoard projectId={projectId} />;

      case "members":
        return <ProjectMemberList project={project} canManageMembers={canManageMembers} />;

      case "meetings":
        return <ProjectMeetingList project={project} />;

      case "documents":
        return <ProjectDocuments project={project} canManageCollaborators={canManageCollaborators} />;

      case "budget-requests":
        return <BudgetRequestList project={project} />;

      case "settings":
        return <ProjectSettings project={project} canChangeSettings={canChangeSettings} />;

      default:
        return (
          <div className="space-y-4 sm:space-y-6">
            <ProjectDashboard project={project} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <ProjectBudget project={project} />
            </div>
          </div>
        );
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "planning":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "on_hold":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "completed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  return (
    <PageLayoutWrapper>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
            <button
              onClick={() => navigate(`/workspace/${workspaceId}`)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
                {project.name}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 line-clamp-1">
                {project.description || "No description provided"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <div className="flex items-center gap-1 sm:gap-2">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(
                  project.status
                )}`}
              >
                {project.status.replace("_", " ")}
              </span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getPriorityColor(
                  project.priority
                )}`}
              >
                {project.priority}
              </span>
            </div>
            <div className="relative">
              {canEdit && (
                <button 
                  onClick={() => setShowEditModal(true)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  title="Edit Project"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Project Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <CustomCard className="p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                  Total Tasks
                </p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {project.taskCount || 0}
                </p>
              </div>
            </div>
          </CustomCard>

          <CustomCard className="p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                  Completed
                </p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {project.completedTaskCount || 0}
                </p>
              </div>
            </div>
          </CustomCard>

          <CustomCard className="p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                  Team Members
                </p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {project.team?.length || 0}
                </p>
              </div>
            </div>
          </CustomCard>

          <CustomCard className="p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                  Meetings
                </p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {project.meetingCount || 0}
                </p>
              </div>
            </div>
          </CustomCard>
        </div>

        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-2 sm:space-x-4 lg:space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1 sm:gap-2 py-2 px-1 sm:px-2 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
        <div className="min-h-[400px] sm:min-h-[500px] lg:min-h-[600px]">{renderTabContent()}</div>
      </div>

      {/* Edit Project Modal */}
      <ProjectEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        project={project}
      />
    </PageLayoutWrapper>
  );
};

export default ProjectPage;

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
} from "lucide-react";
import { projectApi } from "../../api/projectApi";
import PageLayoutWrapper from "../../components/ui/PageLayoutWrapper";
import CustomCard from "../../components/ui/CustomCard";
import CustomButton from "../../components/ui/CustomButton";
import ProjectKanbanBoard from "../../components/kanban/ProjectKanbanBoard";
import ProjectDashboard from "../../components/project/ProjectDashboard";
import ProjectMemberList from "../../components/project/ProjectMemberList";
import ProjectMeetingList from "../../components/project/ProjectMeetingList";

const ProjectPage = () => {
  const { workspaceId, projectId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch project
  const {
    data: projectData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => projectApi.getProject(projectId),
    enabled: !!projectId,
  });

  const project = projectData?.data?.data?.project;

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "board", label: "Kanban Board", icon: Settings },
    { id: "members", label: "Members", icon: Users },
    { id: "meetings", label: "Meetings", icon: Calendar },
  ];

  if (isLoading) {
    return (
      <PageLayout title="Loading..." subtitle="Please wait">
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
      </PageLayout>
    );
  }

  if (error || !project) {
    return (
      <PageLayout
        title="Project Not Found"
        subtitle="The project you're looking for doesn't exist"
      >
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">Failed to load project</p>
          <Button onClick={() => navigate(`/workspace/${workspaceId}`)}>
            Back to Workspace
          </Button>
        </div>
      </PageLayout>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return <ProjectDashboard project={project} />;

      case "board":
        return <ProjectKanbanBoard projectId={projectId} />;

      case "members":
        return <ProjectMemberList project={project} />;

      case "meetings":
        return <ProjectMeetingList project={project} />;

      default:
        return <ProjectDashboard project={project} />;
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
    <PageLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/workspace/${workspaceId}`)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {project.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {project.description || "No description provided"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                  project.status
                )}`}
              >
                {project.status.replace("_", " ")}
              </span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                  project.priority
                )}`}
              >
                {project.priority}
              </span>
            </div>
            <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Project Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Tasks
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {project.taskCount || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Completed
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {project.completedTaskCount || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Team Members
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {project.team?.length || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Meetings
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {project.meetingCount || 0}
                </p>
              </div>
            </div>
          </Card>
        </div>

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
                      ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
        <div className="min-h-[600px]">{renderTabContent()}</div>
      </div>
    </PageLayout>
  );
};

export default ProjectPage;

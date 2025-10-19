import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Filter, Grid, List, Users, PenTool } from 'lucide-react';
import { toast } from 'react-hot-toast';
import WhiteboardList from '../../components/whiteboard/WhiteboardList';
import WhiteboardLoading from '../../components/whiteboard/WhiteboardLoading';
import WhiteboardError from '../../components/whiteboard/WhiteboardError';
import WhiteboardSearch from '../../components/whiteboard/WhiteboardSearch';
import Button from '../../components/ui/Button';
import { getUserWhiteboards } from '../../api/whiteboardApi';

export default function WhiteboardsList() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'own', 'shared', 'search'
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch whiteboards based on active tab
  const { data: whiteboardsData, isLoading, error, refetch } = useQuery({
    queryKey: ['whiteboards', activeTab],
    queryFn: () => getUserWhiteboards({ 
      type: activeTab === 'all' ? undefined : activeTab,
      search: searchQuery || undefined
    }),
  });

  const handleCreateWhiteboard = () => {
    navigate('/boards/new');
  };

  const handleEditWhiteboard = (whiteboard) => {
    if (whiteboard.visibility === 'shared') {
      navigate(`/boards/shared/${whiteboard._id}`);
    } else {
      navigate(`/boards/${whiteboard._id}`);
    }
  };

  const handleViewWhiteboard = (whiteboard) => {
    if (whiteboard.visibility === 'shared') {
      navigate(`/boards/shared/${whiteboard._id}`);
    } else {
      navigate(`/boards/${whiteboard._id}`);
    }
  };

  const handleShareWhiteboard = (whiteboard) => {
    toast('Share functionality will be available in the whiteboard editor');
  };

  const handleDeleteWhiteboard = (whiteboard) => {
    toast('Delete functionality will be available in the whiteboard editor');
  };

  const handleWhiteboardSelect = (whiteboard) => {
    handleEditWhiteboard(whiteboard);
  };

  const tabs = [
    { id: 'all', label: 'All Whiteboards', count: whiteboardsData?.data?.pagination?.total || 0 },
    { id: 'own', label: 'My Whiteboards', count: whiteboardsData?.data?.whiteboards?.filter(w => w.owner?._id)?.length || 0 },
    { id: 'shared', label: 'Shared with Me', count: whiteboardsData?.data?.whiteboards?.filter(w => w.visibility === 'shared')?.length || 0 },
    { id: 'search', label: 'Search', count: 0 }
  ];

  if (isLoading) {
    return <WhiteboardLoading message="Loading whiteboards..." />;
  }

  if (error) {
    return (
      <WhiteboardError 
        message="Failed to load whiteboards. Please try again." 
        onRetry={() => refetch()} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-900">
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      ></div>
      
      {/* Main Content */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 xl:px-12 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                <PenTool className="w-8 h-8 text-indigo-600" />
                Whiteboards
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Create and collaborate on interactive whiteboards in real-time
              </p>
            </div>
            <Button
              onClick={handleCreateWhiteboard}
              className="flex items-center gap-2 px-6 py-3"
            >
              <Plus className="w-5 h-5" />
              New Whiteboard
            </Button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{tab.label}</span>
                    {tab.count > 0 && (
                      <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full text-xs">
                        {tab.count}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          {activeTab === 'search' ? (
            <WhiteboardSearch onWhiteboardSelect={handleWhiteboardSelect} />
          ) : (
            <WhiteboardList
              whiteboards={whiteboardsData?.data?.whiteboards || []}
              loading={isLoading}
              onCreateWhiteboard={handleCreateWhiteboard}
              onEditWhiteboard={handleEditWhiteboard}
              onShareWhiteboard={handleShareWhiteboard}
              onDeleteWhiteboard={handleDeleteWhiteboard}
              onViewWhiteboard={handleViewWhiteboard}
            />
          )}
        </div>
      </div>
    </div>
  );
}

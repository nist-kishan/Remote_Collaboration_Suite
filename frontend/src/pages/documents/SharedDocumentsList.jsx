import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Users, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import DocumentList from '../../components/documents/DocumentList';
import DocumentLoadingSpinner from '../../components/documents/DocumentLoadingSpinner';
import DocumentErrorDisplay from '../../components/documents/DocumentErrorDisplay';
import CustomButton from '../../components/ui/CustomButton';
import { getUserDocuments } from '../../api/documentApi';

export default function SharedDocumentsList() {
  const navigate = useNavigate();

  // Fetch only shared documents
  const { data: documentsData, isLoading, error, refetch } = useQuery({
    queryKey: ['documents', 'shared'],
    queryFn: () => getUserDocuments({ type: 'shared' }),
  });

  const handleEditDocument = (document) => {
    navigate(`/documents/shared/${document._id}`);
  };

  const handleViewDocument = (document) => {
    navigate(`/documents/shared/${document._id}`);
  };

  const handleShareDocument = (document) => {
    toast('Share functionality will be available in the document editor');
  };

  const handleCollaborateDocument = (document) => {
    toast('Collaboration functionality will be available in the document editor');
  };

  const handleDeleteDocument = (document) => {
    toast('You cannot delete documents shared with you');
  };

  const handleBack = () => {
    navigate('/documents');
  };

  if (isLoading) {
    return <DocumentLoadingSpinner message="Loading shared documents..." />;
  }

  if (error) {
    return (
      <DocumentErrorDisplay 
        message="Failed to load shared documents. Please try again." 
        onRetry={() => refetch()} 
      />
    );
  }

  const sharedDocuments = documentsData?.data?.documents || [];

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
            <div className="flex items-center gap-4">
              <CustomButton
                variant="outline"
                onClick={handleBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Documents
              </CustomButton>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                  <Users className="w-8 h-8 text-indigo-600" />
                  Shared Documents
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Documents shared with you by other users
                </p>
              </div>
            </div>
          </div>

          {/* Documents List */}
          {sharedDocuments.length > 0 ? (
            <DocumentList
              documents={sharedDocuments}
              loading={isLoading}
              onEditDocument={handleEditDocument}
              onShareDocument={handleShareDocument}
              onDeleteDocument={handleDeleteDocument}
              onViewDocument={handleViewDocument}
              onCollaborateDocument={handleCollaborateDocument}
              showCreateButton={false}
            />
          ) : (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No shared documents
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                You don't have any documents shared with you yet.
              </p>
              <CustomButton
                onClick={handleBack}
                variant="outline"
              >
                Go to My Documents
              </CustomButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

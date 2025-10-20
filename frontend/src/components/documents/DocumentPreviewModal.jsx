import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { getDocument, getDocumentPreview } from '../../api/documentApi';
import DocumentLoadingSpinner from './DocumentLoadingSpinner';
import DocumentErrorDisplay from './DocumentErrorDisplay';
import CustomButton from '../ui/CustomButton';
import CustomCard from '../ui/CustomCard';

export default function DocumentPreview() {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useSelector((state) => state.auth);
  const isAuthenticated = !!currentUser;

  // Fetch document preview
  const { data: previewData, isLoading, error } = useQuery({
    queryKey: ['documentPreview', documentId],
    queryFn: async () => {
      console.log('Fetching document preview for ID:', documentId);
      try {
        // Try to get document with authentication first
        const result = await getDocument(documentId);
        return result;
      } catch (err) {
        console.log('Authenticated access failed, trying public preview:', err);
        // If authenticated access fails, try public preview
        try {
          const result = await getDocumentPreview(documentId);
          return result;
        } catch (publicErr) {
          console.error('Both authenticated and public access failed:', publicErr);
          throw publicErr;
        }
      }
    },
    enabled: !!documentId,
    onError: (err) => {
      console.error('Document preview error:', err);
    },
    onSuccess: (data) => {
      console.log('Document preview success:', data);
    }
  });

  const handleSignIn = () => {
    navigate('/login');
  };

  const handleSignUp = () => {
    navigate('/signup');
  };

  const handleViewFullDocument = () => {
    if (isAuthenticated) {
      navigate(`/documents/edit/${documentId}`);
    } else {
      navigate('/login');
    }
  };

  if (isLoading) {
    return <DocumentLoadingSpinner message="Loading document preview..." />;
  }

  if (error) {
    return (
      <DocumentErrorDisplay 
        message={`Failed to load document preview. ${error?.response?.data?.message || error?.message || 'The document may not exist or you may not have access to it.'}`}
        onRetry={() => {
          queryClient.invalidateQueries(['documentPreview', documentId]);
        }} 
      />
    );
  }

  const document = previewData?.data?.document;

  if (!document) {
    return (
      <DocumentErrorDisplay 
        message="Document not found or you may not have access to it." 
        onRetry={() => {
          queryClient.invalidateQueries(['documentPreview', documentId]);
        }} 
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
      
      {/* Header */}
      <div className="relative z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Document Preview
                </h1>
              </div>
            </div>
            
            {!isAuthenticated && (
              <div className="flex items-center space-x-3">
                <CustomButton
                  variant="outline"
                  onClick={handleSignIn}
                  className="px-4 py-2"
                >
                  Sign In
                </CustomButton>
                <CustomButton
                  onClick={handleSignUp}
                  className="px-4 py-2"
                >
                  Sign Up
                </CustomButton>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Document Info Card */}
          <CustomCard className="mb-8 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {document.title}
                </h2>
                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-white">
                        {document.owner?.name?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                    <span>Shared by {document.owner?.name}</span>
                  </div>
                  <span>•</span>
                  <span>Version {document.version}</span>
                  <span>•</span>
                  <span>Updated {new Date(document.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
              
              {isAuthenticated ? (
                <CustomButton
                  onClick={handleViewFullDocument}
                  className="ml-4"
                >
                  View Full Document
                </CustomButton>
              ) : (
                <CustomButton
                  onClick={handleSignIn}
                  className="ml-4"
                >
                  Sign In to Edit
                </CustomButton>
              )}
            </div>

            {/* Tags */}
            {document.tags && document.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {document.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Preview Notice */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    Preview Mode
                  </h3>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    You're viewing a preview of this document. {isAuthenticated ? 'Sign in to edit and collaborate.' : 'Sign in or create an account to edit and collaborate on this document.'}
                  </p>
                </div>
              </div>
            </div>
          </CustomCard>

          {/* Document Content */}
          <CustomCard className="p-8">
            <div className="prose prose-lg dark:prose-invert max-w-none">
              {document.content ? (
                <div 
                  className="whitespace-pre-wrap text-gray-900 dark:text-gray-100"
                  dangerouslySetInnerHTML={{ __html: document.content.replace(/\n/g, '<br>') }}
                />
              ) : (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-500 dark:text-gray-400 text-lg">
                    This document is empty
                  </p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                    {isAuthenticated ? 'Sign in to start editing.' : 'Sign in to add content to this document.'}
                  </p>
                </div>
              )}
            </div>
          </CustomCard>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Upload, Trash2, Download, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { projectApi } from '../../api/projectApi';
import CustomButton from '../ui/CustomButton';
import CustomCard from '../ui/CustomCard';

const ProjectDocuments = ({ project, canManageCollaborators = true }) => {
  const queryClient = useQueryClient();
  const [showUpload, setShowUpload] = useState(false);
  const [documentName, setDocumentName] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');

  const documents = project?.documents || [];

  const addDocumentMutation = useMutation({
    mutationFn: (data) => {
      const updatedDocuments = [...documents, data];
      return projectApi.updateProject(project._id, { documents: updatedDocuments });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['project', project._id]);
      toast.success('Document added successfully');
      setShowUpload(false);
      setDocumentName('');
      setDocumentUrl('');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to add document');
    }
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: (documentIndex) => {
      const updatedDocuments = documents.filter((_, index) => index !== documentIndex);
      return projectApi.updateProject(project._id, { documents: updatedDocuments });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['project', project._id]);
      toast.success('Document deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete document');
    }
  });

  const handleAddDocument = () => {
    if (!documentName.trim() || !documentUrl.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    addDocumentMutation.mutate({
      name: documentName,
      url: documentUrl,
      uploadedAt: new Date()
    });
  };

  const handleDeleteDocument = (index) => {
    deleteDocumentMutation.mutate(index);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Project Documents
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage project documents and files
            </p>
          </div>
        </div>
        {canManageCollaborators && (
          <CustomButton
            onClick={() => setShowUpload(!showUpload)}
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            {showUpload ? 'Cancel' : 'Add Document'}
          </CustomButton>
        )}
      </div>

      {/* Add Document Form */}
      {showUpload && (
        <CustomCard className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Document Name
              </label>
              <input
                type="text"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter document name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Document URL
              </label>
              <input
                type="url"
                value={documentUrl}
                onChange={(e) => setDocumentUrl(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter document URL"
              />
            </div>
            <CustomButton
              onClick={handleAddDocument}
              disabled={addDocumentMutation.isPending}
              className="w-full"
            >
              {addDocumentMutation.isPending ? 'Adding...' : 'Add Document'}
            </CustomButton>
          </div>
        </CustomCard>
      )}

      {/* Documents List */}
      {documents.length === 0 ? (
        <CustomCard className="p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            No documents uploaded yet
          </p>
        </CustomCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map((doc, index) => (
            <CustomCard key={index} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 dark:text-white truncate">
                      {doc.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : 'Unknown date'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => handleDeleteDocument(index)}
                    className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </CustomCard>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectDocuments;


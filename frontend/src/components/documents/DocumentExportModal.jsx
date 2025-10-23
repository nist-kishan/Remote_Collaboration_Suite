import React, { useState } from 'react';
import { X, Download, FileText, FileImage, FileCode, CheckCircle } from 'lucide-react';
import CustomButton from '../ui/CustomButton';
import { toast } from 'react-hot-toast';

const DocumentExportModal = ({ 
  document, 
  isOpen, 
  onClose, 
  onExport,
  loading = false 
}) => {
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [includeComments, setIncludeComments] = useState(false);
  const [includeMetadata, setIncludeMetadata] = useState(true);

  const exportFormats = [
    {
      id: 'pdf',
      name: 'PDF Document',
      description: 'Portable Document Format - best for sharing and printing',
      icon: <FileText className="w-6 h-6 text-red-600" />,
      extension: 'html' // Backend returns HTML for PDF format
    },
    {
      id: 'txt',
      name: 'Plain Text',
      description: 'Simple text format - universal compatibility',
      icon: <FileCode className="w-6 h-6 text-gray-600" />,
      extension: 'txt'
    },
    {
      id: 'html',
      name: 'HTML Document',
      description: 'Web format - viewable in browsers',
      icon: <FileCode className="w-6 h-6 text-orange-600" />,
      extension: 'html'
    },
    {
      id: 'md',
      name: 'Markdown',
      description: 'Markdown format - developer friendly',
      icon: <FileCode className="w-6 h-6 text-purple-600" />,
      extension: 'md'
    }
  ];

  const handleExport = async () => {
    try {
      await onExport(document._id, selectedFormat, {
        includeComments,
        includeMetadata
      });
      onClose();
    } catch (error) {
      toast.error('Failed to export document');
    }
  };

  const getFormatInfo = (formatId) => {
    return exportFormats.find(f => f.id === formatId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-green-500">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Download className="w-6 h-6 text-green-600 dark:text-green-400" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Export Document
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {document?.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Format Selection */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Choose Export Format
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {exportFormats.map((format) => (
                <label
                  key={format.id}
                  className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedFormat === format.id
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <input
                    type="radio"
                    name="format"
                    value={format.id}
                    checked={selectedFormat === format.id}
                    onChange={(e) => setSelectedFormat(e.target.value)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {format.icon}
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {format.name}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {format.description}
                    </p>
                  </div>
                  {selectedFormat === format.id && (
                    <CheckCircle className="w-5 h-5 text-green-600 mt-1" />
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Export Options */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Export Options
            </h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <input
                  type="checkbox"
                  checked={includeComments}
                  onChange={(e) => setIncludeComments(e.target.checked)}
                  className="rounded"
                />
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                    Include Comments
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Export all comments and annotations
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <input
                  type="checkbox"
                  checked={includeMetadata}
                  onChange={(e) => setIncludeMetadata(e.target.checked)}
                  className="rounded"
                />
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                    Include Metadata
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Export document properties and creation info
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Format Preview */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
              Export Preview
            </h4>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p><strong>Format:</strong> {getFormatInfo(selectedFormat)?.name}</p>
              <p><strong>File Extension:</strong> .{getFormatInfo(selectedFormat)?.extension}</p>
              <p><strong>Comments:</strong> {includeComments ? 'Included' : 'Not included'}</p>
              <p><strong>Metadata:</strong> {includeMetadata ? 'Included' : 'Not included'}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <CustomButton
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </CustomButton>
            <CustomButton
              onClick={handleExport}
              disabled={loading}
              loading={loading}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <Download className="w-4 h-4" />
              Export as {getFormatInfo(selectedFormat)?.name}
            </CustomButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentExportModal;

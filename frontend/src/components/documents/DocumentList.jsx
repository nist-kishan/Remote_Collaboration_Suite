import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Grid,
  ChevronLeft,
  ChevronRight,
  List
} from "lucide-react";
import { useSelector } from "react-redux";
import CustomButton from "../ui/CustomButton";
import CustomInput from "../ui/CustomInput";
import DocumentCardItem from "./DocumentCardItem";

const DocumentListOptimized = ({ 
  documents = [], 
  loading = false, 
  viewMode = "grid",
  onCreateDocument,
  onEditDocument,
  onShareDocument,
  onDeleteDocument,
  onViewDocument,
  onUploadDocument,
  onExportDocument,
  showCreateButton = true,
  className = "" 
}) => {
  const { user: currentUser } = useSelector((state) => state.auth);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [localViewMode, setLocalViewMode] = useState(viewMode);
  const itemsPerPage = 12;

  // Update local view mode when prop changes
  useEffect(() => {
    setLocalViewMode(viewMode);
  }, [viewMode]);

  // Ensure documents is an array
  const safeDocuments = Array.isArray(documents) ? documents : [];

  const filteredDocuments = safeDocuments.filter((doc) => {
    // Skip null or undefined documents
    if (!doc) return false;

    const matchesSearch = 
      doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesSearch;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentDocuments = filteredDocuments.slice(startIndex, endIndex).filter(doc => doc && doc._id);


  return (
    <div className={`space-y-6 ${className}`}>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <CustomInput
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setLocalViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  localViewMode === 'grid'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
                title="Grid View"
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setLocalViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  localViewMode === 'list'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
                title="List View"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Documents Grid/List */}
      {currentDocuments.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Grid className="w-8 h-8 text-gray-500 dark:text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {searchTerm ? "No documents found" : "No documents yet"}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto text-sm">
            {searchTerm 
              ? "Try adjusting your search to find what you're looking for"
              : "Create your first document and start collaborating with your team"
            }
          </p>
          {!searchTerm && showCreateButton && (
            <CustomButton 
              onClick={onCreateDocument} 
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Document
            </CustomButton>
          )}
        </div>
      ) : (
        <>
          <div className={
            localViewMode === "grid" 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
              : "space-y-3 sm:space-y-4"
          }>
            {currentDocuments.map((document, index) => {
              if (!document || !document._id) return null;
              
              return (
                <DocumentCardItem
                  key={document._id || `doc-${index}`}
                  document={document}
                  currentUser={currentUser}
                  onEdit={onEditDocument}
                  onShare={onShareDocument}
                  onDelete={onDeleteDocument}
                  onView={onViewDocument}
                  onUpload={onUploadDocument}
                  onExport={onExportDocument}
                  className={localViewMode === "list" ? "flex-row" : ""}
                />
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredDocuments.length)} of {filteredDocuments.length} documents
              </div>
              
              <div className="flex items-center gap-2">
                <CustomButton
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Previous</span>
                </CustomButton>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <CustomButton
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 p-0 text-sm ${currentPage === pageNum 
                          ? "bg-blue-600 text-white border-blue-600" 
                          : "hover:bg-gray-50 dark:hover:bg-gray-700"
                        }`}
                      >
                        {pageNum}
                      </CustomButton>
                    );
                  })}
                </div>
                
                <CustomButton
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </CustomButton>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DocumentListOptimized;

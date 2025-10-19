import React, { useState } from "react";
import { 
  Search, 
  Filter, 
  Plus, 
  FileText, 
  Users, 
  Eye,
  Grid,
  List,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useSelector } from "react-redux";
import Button from "../ui/Button";
import Input from "../ui/Input";
import DocumentCard from "./DocumentCard";
import Container from "../ui/Container";

const DocumentList = ({ 
  documents = [], 
  loading = false, 
  onCreateDocument,
  onEditDocument,
  onShareDocument,
  onDeleteDocument,
  onViewDocument,
  showCreateButton = true,
  className = "" 
}) => {
  const { user: currentUser } = useSelector((state) => state.auth);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = 
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFilter = 
      filterType === "all" ||
      (filterType === "own" && doc.owner?._id === currentUser?._id) ||
      (filterType === "shared" && doc.visibility === "shared") ||
      (filterType === "draft" && doc.status === "draft");

    return matchesSearch && matchesFilter;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentDocuments = filteredDocuments.slice(startIndex, endIndex);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType]);


  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="relative mx-auto w-16 h-16 mb-4">
          {/* Outer pulsing circle */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 opacity-20 animate-pulse"></div>
          
          {/* Spinning loader */}
          <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-white dark:bg-gray-800 shadow-lg">
            <div className="animate-spin rounded-full h-10 w-10 border-3 border-indigo-200 dark:border-indigo-900"></div>
            <div className="animate-spin rounded-full h-10 w-10 border-t-3 border-indigo-600 absolute"></div>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-400 font-medium">Loading documents...</p>
      </div>
    );
  }

  return (
    <div className={`space-y-8 lg:space-y-12 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Documents
            </h1>
          </div>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl">
            Manage your documents and collaborate with others in real-time
          </p>
        </div>
        {showCreateButton && (
          <Button 
            onClick={onCreateDocument} 
            className="flex items-center gap-2 w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">New Document</span>
            <span className="sm:hidden">New</span>
          </Button>
        )}
      </div>

      {/* Filters and Search */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 p-8">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50/50 dark:bg-gray-700/50 text-lg"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="pl-12 pr-10 py-4 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50/50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base appearance-none font-medium"
              >
                <option value="all">All Documents</option>
                <option value="own">My Documents</option>
                <option value="shared">Shared with Me</option>
                <option value="draft">Drafts</option>
              </select>
            </div>

            <div className="flex items-center bg-gray-100/50 dark:bg-gray-700/50 rounded-xl p-2 backdrop-blur-sm">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-3 rounded-lg transition-all duration-200 ${viewMode === "grid" ? "bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-md" : "text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-600/50"}`}
                title="Grid View"
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-3 rounded-lg transition-all duration-200 ${viewMode === "list" ? "bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-md" : "text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-600/50"}`}
                title="List View"
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Documents Grid/List */}
      {filteredDocuments.length === 0 ? (
        <div className="text-center py-24">
          <div className="relative">
            <div className="bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-8 shadow-lg">
              <FileText className="w-16 h-16 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <Plus className="w-4 h-4 text-white" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {searchTerm || filterType !== "all" ? "No documents found" : "Ready to get started?"}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-10 max-w-lg mx-auto text-lg leading-relaxed">
            {searchTerm || filterType !== "all" 
              ? "Try adjusting your search or filters to find what you're looking for"
              : "Create your first document and start collaborating with your team in real-time"
            }
          </p>
          {!searchTerm && filterType === "all" && showCreateButton && (
            <Button 
              onClick={onCreateDocument} 
              className="px-10 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Document
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className={
            viewMode === "grid" 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8"
              : "space-y-4 lg:space-y-6"
          }>
            {currentDocuments.map((document) => (
              <DocumentCard
                key={document._id}
                document={document}
                currentUser={currentUser}
                onEdit={onEditDocument}
                onShare={onShareDocument}
                onDelete={onDeleteDocument}
                onView={onViewDocument}
                className={viewMode === "list" ? "flex-row" : ""}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredDocuments.length)} of {filteredDocuments.length} documents
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2 px-4 py-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                
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
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-10 h-10 p-0 ${currentPage === pageNum 
                          ? "bg-indigo-600 text-white border-indigo-600" 
                          : "hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                        }`}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-2 px-4 py-2"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DocumentList;

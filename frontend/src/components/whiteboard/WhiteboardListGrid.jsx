import React, { useState } from "react";
import { 
  Search, 
  Filter, 
  Plus, 
  Grid, 
  List,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useSelector } from "react-redux";
import CustomButton from "../ui/CustomButton";
import CustomInput from "../ui/CustomInput";
import WhiteboardCardItem from "./WhiteboardCardItem";

const WhiteboardList = ({ 
  whiteboards = [], 
  loading = false, 
  onCreateWhiteboard,
  onEditWhiteboard,
  onShareWhiteboard,
  onDeleteWhiteboard,
  onViewWhiteboard,
  showCreateButton = true,
  className = "" 
}) => {
  const { user: currentUser } = useSelector((state) => state.auth);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const filteredWhiteboards = whiteboards.filter((whiteboard) => {
    const matchesSearch = 
      whiteboard.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      whiteboard.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      whiteboard.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFilter = 
      filterType === "all" ||
      (filterType === "own" && whiteboard.owner?._id === currentUser?._id) ||
      (filterType === "shared" && whiteboard.visibility === "shared") ||
      (filterType === "draft" && whiteboard.status === "draft");

    return matchesSearch && matchesFilter;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredWhiteboards.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentWhiteboards = filteredWhiteboards.slice(startIndex, endIndex);

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header */}

      {/* Filters and Search */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 p-8">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <CustomInput
                placeholder="Search whiteboards..."
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
                <option value="all">All Whiteboards</option>
                <option value="own">My Whiteboards</option>
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

      {/* Whiteboards Grid/List */}
      {currentWhiteboards.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Grid className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {searchTerm || filterType !== "all" ? "No whiteboards found" : "No whiteboards yet"}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            {searchTerm || filterType !== "all" 
              ? "Try adjusting your search or filters to find what you're looking for"
              : "Create your first whiteboard and start collaborating with your team in real-time"
            }
          </p>
          {!searchTerm && filterType === "all" && showCreateButton && (
            <CustomButton 
              onClick={onCreateWhiteboard} 
              className="px-10 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Whiteboard
            </CustomButton>
          )}
        </div>
      ) : (
        <>
          <div className={
            viewMode === "grid" 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8"
              : "space-y-4 lg:space-y-6"
          }>
            {currentWhiteboards.map((whiteboard) => (
              <WhiteboardCardItem
                key={whiteboard._id}
                whiteboard={whiteboard}
                currentUser={currentUser}
                onEdit={onEditWhiteboard}
                onShare={onShareWhiteboard}
                onDelete={onDeleteWhiteboard}
                onView={onViewWhiteboard}
                className={viewMode === "list" ? "flex-row" : ""}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredWhiteboards.length)} of {filteredWhiteboards.length} whiteboards
              </div>
              
              <div className="flex items-center gap-2">
                <CustomButton
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2 px-4 py-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
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
                        className={`w-10 h-10 p-0 ${currentPage === pageNum 
                          ? "bg-indigo-600 text-white border-indigo-600" 
                          : "hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
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
                  className="flex items-center gap-2 px-4 py-2"
                >
                  Next
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

export default WhiteboardList;

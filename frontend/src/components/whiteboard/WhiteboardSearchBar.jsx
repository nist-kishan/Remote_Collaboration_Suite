import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, X, Filter } from 'lucide-react';
import { searchWhiteboards } from '../../api/whiteboardApi';
import CustomButton from '../ui/CustomButton';
import CustomInput from '../ui/CustomInput';
import CustomCard from '../ui/CustomCard';
import WhiteboardCardItem from './WhiteboardCardItem';

export default function WhiteboardSearch({ onWhiteboardSelect }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    status: ''
  });
  const [isSearching, setIsSearching] = useState(false);

  // Search query
  const { data: searchResults, isLoading, error, refetch } = useQuery({
    queryKey: ['whiteboardSearch', searchQuery, filters],
    queryFn: () => searchWhiteboards({
      q: searchQuery,
      ...filters
    }),
    enabled: isSearching && searchQuery.trim().length > 0,
  });

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearching(true);
      refetch();
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setFilters({ type: '', status: '' });
    setIsSearching(false);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <CustomCard className="p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <CustomInput
                  type="text"
                  placeholder="Search whiteboards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <CustomButton
              type="submit"
              disabled={!searchQuery.trim() || isLoading}
              loading={isLoading}
            >
              Search
            </CustomButton>
            {isSearching && (
              <CustomButton
                type="button"
                variant="outline"
                onClick={handleClearSearch}
              >
                <X className="w-4 h-4" />
                Clear
              </CustomButton>
            )}
          </div>

          {/* Filters */}
          <div className="flex gap-4 items-center">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Types</option>
              <option value="own">My Whiteboards</option>
              <option value="shared">Shared with Me</option>
              <option value="draft">Drafts</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </form>
      </CustomCard>

      {/* Search Results */}
      {isSearching && (
        <div>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Searching whiteboards...</p>
            </div>
          ) : error ? (
            <CustomCard className="p-6">
              <div className="text-center text-red-600 dark:text-red-400">
                <p>Failed to search whiteboards. Please try again.</p>
                <CustomButton
                  variant="outline"
                  onClick={() => refetch()}
                  className="mt-4"
                >
                  Retry
                </CustomButton>
              </div>
            </CustomCard>
          ) : searchResults?.data?.whiteboards?.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Search Results
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Found {searchResults.data.pagination.total} whiteboards
                </p>
              </div>
              
              <div className="grid gap-4">
                {searchResults.data.whiteboards.map((whiteboard) => (
                  <WhiteboardCardItem
                    key={whiteboard._id}
                    whiteboard={whiteboard}
                    onEdit={onWhiteboardSelect}
                    onView={onWhiteboardSelect}
                    onShare={onWhiteboardSelect}
                    onDelete={onWhiteboardSelect}
                  />
                ))}
              </div>

              {/* Pagination */}
              {searchResults.data.pagination.pages > 1 && (
                <div className="flex justify-center mt-6">
                  <div className="flex gap-2">
                    {Array.from({ length: searchResults.data.pagination.pages }, (_, i) => i + 1).map((page) => (
                      <CustomButton
                        key={page}
                        variant={page === searchResults.data.pagination.page ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          // Handle pagination
                          refetch();
                        }}
                      >
                        {page}
                      </CustomButton>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <CustomCard className="p-6">
              <div className="text-center text-gray-600 dark:text-gray-400">
                <p>No whiteboards found matching your search criteria.</p>
                <p className="text-sm mt-2">Try adjusting your search terms or filters.</p>
              </div>
            </CustomCard>
          )}
        </div>
      )}

      {/* Search Tips */}
      {!isSearching && (
        <CustomCard className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Search Tips
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Search by content:</h4>
              <ul className="space-y-1">
                <li>• Whiteboard title</li>
                <li>• Whiteboard description</li>
                <li>• Tags</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Filter by:</h4>
              <ul className="space-y-1">
                <li>• Whiteboard type (own, shared, draft)</li>
                <li>• Status (draft, active, archived)</li>
                <li>• Date range</li>
              </ul>
            </div>
          </div>
        </CustomCard>
      )}
    </div>
  );
}

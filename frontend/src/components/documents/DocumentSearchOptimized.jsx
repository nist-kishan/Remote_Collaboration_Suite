import React, { useState, useEffect } from 'react';
import { Search, X, Filter, Calendar, Tag, User } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';
import { useDocumentSearch } from '../../hook/useDocument';

export default function DocumentSearchOptimized({ onSearch, placeholder = "Search documents..." }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    tags: '',
    dateRange: ''
  });
  const [isSearching, setIsSearching] = useState(false);

  const {
    searchResults,
    searchLoading,
    searchError,
    refetchSearch
  } = useDocumentSearch({
    query: searchQuery,
    ...filters
  });

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearching(true);
      refetchSearch();
      if (onSearch) {
        onSearch(searchQuery);
      }
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setFilters({ type: '', status: '', tags: '', dateRange: '' });
    setIsSearching(false);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="space-y-4">
      {/* Search Form */}
      <Card className="p-4">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder={placeholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={!searchQuery.trim() || searchLoading}
              loading={searchLoading}
              size="sm"
            >
              Search
            </Button>
            {isSearching && (
              <Button
                type="button"
                variant="outline"
                onClick={handleClearSearch}
                size="sm"
              >
                <X className="w-4 h-4" />
                Clear
              </Button>
            )}
          </div>

          {/* Advanced Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <Filter className="w-4 h-4 text-gray-500" />
            
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            >
              <option value="">All Types</option>
              <option value="own">My Documents</option>
              <option value="shared">Shared with Me</option>
              <option value="public">Public</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>

            <div className="relative">
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Filter by tags..."
                value={filters.tags}
                onChange={(e) => handleFilterChange('tags', e.target.value)}
                className="pl-10 w-40 text-sm"
              />
            </div>

            <select
              value={filters.dateRange}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            >
              <option value="">Any Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </form>
      </Card>

      {/* Search Results */}
      {isSearching && (
        <div>
          {searchLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Searching documents...</p>
            </div>
          ) : searchError ? (
            <Card className="p-6">
              <div className="text-center text-red-600 dark:text-red-400">
                <p>Failed to search documents. Please try again.</p>
                <Button
                  variant="outline"
                  onClick={() => refetchSearch()}
                  className="mt-4"
                >
                  Retry
                </Button>
              </div>
            </Card>
          ) : searchResults?.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Search Results
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Found {searchResults.length} documents
                </p>
              </div>
              
              <div className="grid gap-3">
                {searchResults.map((document) => (
                  <Card key={document._id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                          {document.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                          {document.description || 'No description available'}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>{document.owner?.name || 'Unknown'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(document.updatedAt).toLocaleDateString()}</span>
                          </div>
                          {document.tags?.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Tag className="w-3 h-3" />
                              <span>{document.tags.slice(0, 3).join(', ')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          document.status === 'published' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}>
                          {document.status}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <Card className="p-6">
              <div className="text-center text-gray-600 dark:text-gray-400">
                <Search className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>No documents found matching your search criteria.</p>
                <p className="text-sm mt-2">Try adjusting your search terms or filters.</p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Search Tips */}
      {!isSearching && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Search Tips
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-xs text-gray-600 dark:text-gray-400">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-1">Search by:</h4>
              <ul className="space-y-1">
                <li>• Document title</li>
                <li>• Document content</li>
                <li>• Tags</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-1">Filter by:</h4>
              <ul className="space-y-1">
                <li>• Document type</li>
                <li>• Status</li>
                <li>• Date range</li>
              </ul>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

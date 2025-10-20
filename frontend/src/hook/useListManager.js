import { useState, useCallback, useMemo } from 'react';

/**
 * UI hook for list management
 * Provides pagination, filtering, sorting, and selection functionality
 */
export const useListManager = (initialItems = [], options = {}) => {
  const {
    itemsPerPage = 10,
    initialPage = 1,
    initialSortBy = null,
    initialSortOrder = 'asc',
    initialFilter = null
  } = options;

  const [items, setItems] = useState(initialItems);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [sortOrder, setSortOrder] = useState(initialSortOrder);
  const [filter, setFilter] = useState(initialFilter);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Filtered and sorted items
  const processedItems = useMemo(() => {
    let processed = [...items];

    // Apply search filter
    if (searchQuery) {
      processed = processed.filter(item =>
        Object.values(item).some(value =>
          value && value.toString().toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Apply custom filter
    if (filter && typeof filter === 'function') {
      processed = processed.filter(filter);
    }

    // Apply sorting
    if (sortBy) {
      processed.sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];
        
        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return processed;
  }, [items, searchQuery, filter, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(processedItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = processedItems.slice(startIndex, endIndex);

  // Pagination handlers
  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, totalPages]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  const goToFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const goToLastPage = useCallback(() => {
    setCurrentPage(totalPages);
  }, [totalPages]);

  // Sorting handlers
  const handleSort = useCallback((field) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  }, [sortBy]);

  // Filter handlers
  const applyFilter = useCallback((newFilter) => {
    setFilter(newFilter);
    setCurrentPage(1); // Reset to first page when filtering
  }, []);

  const clearFilter = useCallback(() => {
    setFilter(null);
    setCurrentPage(1);
  }, []);

  // Search handlers
  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page when searching
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setCurrentPage(1);
  }, []);

  // Selection handlers
  const selectItem = useCallback((item) => {
    setSelectedItems(prev => [...prev, item]);
  }, []);

  const deselectItem = useCallback((item) => {
    setSelectedItems(prev => prev.filter(selected => selected !== item));
  }, []);

  const toggleItemSelection = useCallback((item) => {
    setSelectedItems(prev => {
      const isSelected = prev.includes(item);
      if (isSelected) {
        return prev.filter(selected => selected !== item);
      } else {
        return [...prev, item];
      }
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedItems([...paginatedItems]);
  }, [paginatedItems]);

  const deselectAll = useCallback(() => {
    setSelectedItems([]);
  }, []);

  const toggleSelectAll = useCallback(() => {
    const allSelected = paginatedItems.every(item => selectedItems.includes(item));
    if (allSelected) {
      deselectAll();
    } else {
      selectAll();
    }
  }, [paginatedItems, selectedItems, selectAll, deselectAll]);

  // Items management
  const addItem = useCallback((item) => {
    setItems(prev => [...prev, item]);
  }, []);

  const removeItem = useCallback((item) => {
    setItems(prev => prev.filter(i => i !== item));
    setSelectedItems(prev => prev.filter(selected => selected !== item));
  }, []);

  const updateItem = useCallback((oldItem, newItem) => {
    setItems(prev => prev.map(item => item === oldItem ? newItem : item));
    setSelectedItems(prev => prev.map(item => item === oldItem ? newItem : item));
  }, []);

  const setItemsData = useCallback((newItems) => {
    setItems(newItems);
    setSelectedItems([]);
    setCurrentPage(1);
  }, []);

  // Reset
  const reset = useCallback(() => {
    setItems(initialItems);
    setCurrentPage(initialPage);
    setSortBy(initialSortBy);
    setSortOrder(initialSortOrder);
    setFilter(initialFilter);
    setSelectedItems([]);
    setSearchQuery('');
  }, [initialItems, initialPage, initialSortBy, initialSortOrder, initialFilter]);

  return {
    // Items
    items: processedItems,
    paginatedItems,
    selectedItems,
    
    // Pagination
    currentPage,
    totalPages,
    itemsPerPage,
    goToPage,
    nextPage,
    prevPage,
    goToFirstPage,
    goToLastPage,
    
    // Sorting
    sortBy,
    sortOrder,
    handleSort,
    
    // Filtering
    filter,
    applyFilter,
    clearFilter,
    
    // Search
    searchQuery,
    handleSearch,
    clearSearch,
    
    // Selection
    selectItem,
    deselectItem,
    toggleItemSelection,
    selectAll,
    deselectAll,
    toggleSelectAll,
    
    // Items management
    addItem,
    removeItem,
    updateItem,
    setItems: setItemsData,
    
    // Utilities
    reset,
    
    // Computed values
    totalItems: processedItems.length,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    isAllSelected: paginatedItems.length > 0 && paginatedItems.every(item => selectedItems.includes(item)),
    isPartiallySelected: selectedItems.length > 0 && !paginatedItems.every(item => selectedItems.includes(item))
  };
};

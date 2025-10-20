import { useState, useCallback } from 'react';

/**
 * UI hook for modal state management
 * Provides a clean interface for managing modal visibility and data
 */
export const useModal = (initialState = false) => {
  const [isOpen, setIsOpen] = useState(initialState);
  const [data, setData] = useState(null);

  const openModal = useCallback((modalData = null) => {
    setData(modalData);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setData(null);
  }, []);

  const toggleModal = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  return {
    isOpen,
    data,
    openModal,
    closeModal,
    toggleModal
  };
};

/**
 * UI hook for managing multiple modals
 * Useful when a component needs to manage several modals
 */
export const useMultipleModals = (modalNames) => {
  const [modals, setModals] = useState(
    modalNames.reduce((acc, name) => {
      acc[name] = { isOpen: false, data: null };
      return acc;
    }, {})
  );

  const openModal = useCallback((modalName, data = null) => {
    setModals(prev => ({
      ...prev,
      [modalName]: { isOpen: true, data }
    }));
  }, []);

  const closeModal = useCallback((modalName) => {
    setModals(prev => ({
      ...prev,
      [modalName]: { isOpen: false, data: null }
    }));
  }, []);

  const toggleModal = useCallback((modalName) => {
    setModals(prev => ({
      ...prev,
      [modalName]: {
        ...prev[modalName],
        isOpen: !prev[modalName].isOpen
      }
    }));
  }, []);

  const closeAllModals = useCallback(() => {
    setModals(prev => {
      const newModals = {};
      Object.keys(prev).forEach(key => {
        newModals[key] = { isOpen: false, data: null };
      });
      return newModals;
    });
  }, []);

  return {
    modals,
    openModal,
    closeModal,
    toggleModal,
    closeAllModals
  };
};

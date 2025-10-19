import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDocuments } from '../../store/slice/documentSlice';

// Component to initialize document state on app start
const DocumentStateInitializer = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    // Only fetch documents if user is authenticated
    if (user) {
      dispatch(fetchDocuments());
    }
  }, [dispatch, user]);

  return null; // This component doesn't render anything
};

export default DocumentStateInitializer;

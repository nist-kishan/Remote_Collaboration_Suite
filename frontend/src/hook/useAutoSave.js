import { useCallback, useRef, useEffect, useState } from 'react';
import { autoSaveDocument, enableAutoSave } from '../api/documentApi';
import { toast } from 'react-hot-toast';

export const useAutoSave = (documentId, content, isDocumentSaved = false, debounceMs = 5000) => {
  const timeoutRef = useRef(null);
  const lastSavedContentRef = useRef('');
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('idle'); // 'idle', 'saving', 'saved', 'error'
  const [lastSaved, setLastSaved] = useState(null);

  // Enable auto-save if document is saved (not draft)
  useEffect(() => {
    console.log('=== USE AUTO SAVE HOOK DEBUG ===');
    console.log('Hook initialized at:', new Date().toLocaleTimeString());
    console.log('useAutoSave hook initialized:', { documentId, isDocumentSaved });
    setIsAutoSaveEnabled(isDocumentSaved);
    console.log('Auto-save enabled state set to:', isDocumentSaved);
    console.log('=== END HOOK DEBUG ===');
  }, [isDocumentSaved, documentId]);

  const toggleAutoSave = useCallback(async () => {
    console.log('toggleAutoSave called:', { documentId, isAutoSaveEnabled });
    if (!documentId) return;

    try {
      if (isAutoSaveEnabled) {
        // Disable auto-save
        setIsAutoSaveEnabled(false);
        toast.success('Auto-save disabled');
      } else {
        // Enable auto-save
        await enableAutoSave(documentId);
        setIsAutoSaveEnabled(true);
        toast.success('Auto-save enabled');
      }
    } catch (error) {
      console.error('Failed to toggle auto-save:', error);
      toast.error('Failed to toggle auto-save');
    }
  }, [documentId, isAutoSaveEnabled]);

  const performAutoSave = useCallback(async (contentToSave) => {
    if (!documentId || !isAutoSaveEnabled || !contentToSave) {
      return;
    }

    // Don't auto-save if content hasn't changed
    if (contentToSave === lastSavedContentRef.current) {
      return;
    }

    setAutoSaveStatus('saving');
    
    try {
      await autoSaveDocument(documentId, contentToSave);
      lastSavedContentRef.current = contentToSave;
      setAutoSaveStatus('saved');
      setLastSaved(new Date());
      console.log('Auto-save successful at:', new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Auto-save failed:', error);
      setAutoSaveStatus('error');
      // Don't show toast for auto-save failures to avoid spam
    }
  }, [documentId, isAutoSaveEnabled]);

  const debouncedAutoSave = useCallback((contentToSave) => {
    console.log('=== DEBOUNCED AUTO SAVE DEBUG ===');
    console.log('Content changed, starting 5-second timer at:', new Date().toLocaleTimeString());
    console.log('Content length:', contentToSave?.length);
    console.log('Auto-save enabled:', isAutoSaveEnabled);
    
    // Clear existing timeout
    if (timeoutRef.current) {
      console.log('Clearing existing timeout');
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      console.log('5-second timer completed, triggering auto-save at:', new Date().toLocaleTimeString());
      performAutoSave(contentToSave);
    }, debounceMs);
    
    console.log(`Timer set for ${debounceMs}ms`);
    console.log('=== END DEBOUNCED AUTO SAVE DEBUG ===');
  }, [performAutoSave, debounceMs, isAutoSaveEnabled]);

  // Auto-save when content changes
  useEffect(() => {
    console.log('=== CONTENT CHANGE EFFECT DEBUG ===');
    console.log('Content changed at:', new Date().toLocaleTimeString());
    console.log('Content exists:', !!content);
    console.log('Content length:', content?.length);
    console.log('Auto-save enabled:', isAutoSaveEnabled);
    console.log('Will trigger auto-save:', !!(content && isAutoSaveEnabled));
    
    if (content && isAutoSaveEnabled) {
      console.log('Triggering debounced auto-save...');
      debouncedAutoSave(content);
    } else {
      console.log('Skipping auto-save - conditions not met');
    }
    console.log('=== END CONTENT CHANGE EFFECT DEBUG ===');
  }, [content, debouncedAutoSave, isAutoSaveEnabled]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const manualSave = useCallback(async (contentToSave) => {
    if (!documentId || !contentToSave) {
      return;
    }

    setAutoSaveStatus('saving');
    
    try {
      await autoSaveDocument(documentId, contentToSave);
      lastSavedContentRef.current = contentToSave;
      setAutoSaveStatus('saved');
      setLastSaved(new Date());
      toast.success('Document saved');
      return true;
    } catch (error) {
      console.error('Manual save failed:', error);
      setAutoSaveStatus('error');
      toast.error('Failed to save document');
      return false;
    }
  }, [documentId]);

  return {
    manualSave,
    isAutoSaveEnabled,
    toggleAutoSave,
    autoSaveStatus,
    lastSaved,
  };
};

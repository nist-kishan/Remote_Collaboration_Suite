import { useCallback, useRef } from 'react';

/**
 * Custom hook for handling text selection in rich text editors
 * Replaces direct window.getSelection() usage with React patterns
 */
export const useTextSelection = () => {
  const editorRef = useRef(null);

  // Get current selection
  const getSelection = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return window.getSelection();
  }, []);

  // Get current range
  const getCurrentRange = useCallback(() => {
    const selection = getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    return selection.getRangeAt(0);
  }, [getSelection]);

  // Check if there's a valid selection
  const hasSelection = useCallback(() => {
    const selection = getSelection();
    return selection && selection.rangeCount > 0 && !selection.isCollapsed;
  }, [getSelection]);

  // Insert content at current cursor position
  const insertAtCursor = useCallback((content) => {
    const range = getCurrentRange();
    if (!range) return false;

    range.deleteContents();
    
    if (typeof content === 'string') {
      const textNode = document.createTextNode(content);
      range.insertNode(textNode);
    } else if (content instanceof Node) {
      range.insertNode(content);
    } else {
      return false;
    }

    // Move cursor to end of inserted content
    range.collapse(false);
    const selection = getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }

    return true;
  }, [getCurrentRange, getSelection]);

  // Insert HTML content at current cursor position
  const insertHTMLAtCursor = useCallback((htmlContent) => {
    const range = getCurrentRange();
    if (!range) return false;

    range.deleteContents();
    
    // Create a temporary container to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    // Insert all child nodes
    const fragment = document.createDocumentFragment();
    while (tempDiv.firstChild) {
      fragment.appendChild(tempDiv.firstChild);
    }
    
    range.insertNode(fragment);
    
    // Move cursor to end of inserted content
    range.collapse(false);
    const selection = getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }

    return true;
  }, [getCurrentRange, getSelection]);

  // Wrap selected text with a tag
  const wrapSelection = useCallback((tagName, attributes = {}) => {
    const selection = getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      return false;
    }

    const range = selection.getRangeAt(0);
    const element = document.createElement(tagName);
    
    // Set attributes
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });

    try {
      range.surroundContents(element);
      return true;
    } catch (error) {
      console.warn('Failed to wrap selection:', error);
      return false;
    }
  }, [getSelection]);

  // Get selected text
  const getSelectedText = useCallback(() => {
    const selection = getSelection();
    return selection ? selection.toString() : '';
  }, [getSelection]);

  // Clear selection
  const clearSelection = useCallback(() => {
    const selection = getSelection();
    if (selection) {
      selection.removeAllRanges();
    }
  }, [getSelection]);

  // Focus editor and set cursor position
  const focusEditor = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.focus();
      
      // Ensure cursor is at the end if no selection
      const selection = getSelection();
      if (selection && selection.rangeCount === 0) {
        const range = document.createRange();
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
        selection.addRange(range);
      }
    }
  }, [getSelection]);

  return {
    editorRef,
    getSelection,
    getCurrentRange,
    hasSelection,
    insertAtCursor,
    insertHTMLAtCursor,
    wrapSelection,
    getSelectedText,
    clearSelection,
    focusEditor
  };
};

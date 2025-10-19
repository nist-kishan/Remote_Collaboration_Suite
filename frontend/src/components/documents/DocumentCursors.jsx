import React, { useEffect, useState } from 'react';

const DocumentCursors = ({ activeCollaborators, editorRef }) => {
  const [cursors, setCursors] = useState({});
  const [selections, setSelections] = useState({});

  useEffect(() => {
    if (!editorRef?.current) return;

    const editor = editorRef.current.getEditorElement?.() || editorRef.current;
    if (!editor) return;

    // Create cursor elements for each collaborator
    const cursorElements = {};
    const selectionElements = {};

    activeCollaborators.forEach((collaborator) => {
      if (collaborator.id === 'current-user') return; // Skip current user

      // Create cursor element
      const cursorEl = document.createElement('div');
      cursorEl.className = 'collaborator-cursor';
      cursorEl.style.cssText = `
        position: absolute;
        width: 2px;
        height: 20px;
        background-color: ${getCursorColor(collaborator.id)};
        z-index: 1000;
        pointer-events: none;
        opacity: 0.8;
        transition: all 0.1s ease;
        display: none;
      `;

      // Create cursor label
      const cursorLabel = document.createElement('div');
      cursorLabel.className = 'collaborator-cursor-label';
      cursorLabel.style.cssText = `
        position: absolute;
        top: -20px;
        left: 2px;
        background-color: ${getCursorColor(collaborator.id)};
        color: white;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 11px;
        font-weight: 500;
        white-space: nowrap;
        z-index: 1001;
        pointer-events: none;
        display: none;
      `;
      cursorLabel.textContent = collaborator.name;

      cursorEl.appendChild(cursorLabel);
      editor.appendChild(cursorEl);
      cursorElements[collaborator.id] = cursorEl;

      // Create selection element
      const selectionEl = document.createElement('div');
      selectionEl.className = 'collaborator-selection';
      selectionEl.style.cssText = `
        position: absolute;
        background-color: ${getCursorColor(collaborator.id)};
        opacity: 0.2;
        z-index: 999;
        pointer-events: none;
        display: none;
      `;
      editor.appendChild(selectionEl);
      selectionElements[collaborator.id] = selectionEl;
    });

    setCursors(cursorElements);
    setSelections(selectionElements);

    return () => {
      // Cleanup cursor elements
      Object.values(cursorElements).forEach(el => {
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
      });
      Object.values(selectionElements).forEach(el => {
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
      });
    };
  }, [activeCollaborators, editorRef]);

  // Update cursor positions when collaborators change
  useEffect(() => {
    activeCollaborators.forEach((collaborator) => {
      if (collaborator.id === 'current-user') return;

      const cursorEl = cursors[collaborator.id];
      const selectionEl = selections[collaborator.id];

      if (cursorEl && collaborator.cursor) {
        updateCursorPosition(cursorEl, collaborator.cursor);
      }

      if (selectionEl && collaborator.selection) {
        updateSelectionPosition(selectionEl, collaborator.selection);
      }
    });
  }, [activeCollaborators, cursors, selections]);

  return null; // This component doesn't render anything visible
};

// Helper function to get cursor color based on user ID
const getCursorColor = (userId) => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];
  
  // Simple hash function to get consistent color for user
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

// Helper function to update cursor position
const updateCursorPosition = (cursorEl, cursorData) => {
  if (!cursorData.x || !cursorData.y) {
    cursorEl.style.display = 'none';
    return;
  }

  cursorEl.style.display = 'block';
  cursorEl.style.left = `${cursorData.x}px`;
  cursorEl.style.top = `${cursorData.y}px`;
};

// Helper function to update selection position
const updateSelectionPosition = (selectionEl, selectionData) => {
  if (!selectionData.start || !selectionData.end) {
    selectionEl.style.display = 'none';
    return;
  }

  selectionEl.style.display = 'block';
  selectionEl.style.left = `${selectionData.start.x}px`;
  selectionEl.style.top = `${selectionData.start.y}px`;
  selectionEl.style.width = `${Math.abs(selectionData.end.x - selectionData.start.x)}px`;
  selectionEl.style.height = `${Math.abs(selectionData.end.y - selectionData.start.y)}px`;
};

export default DocumentCursors;

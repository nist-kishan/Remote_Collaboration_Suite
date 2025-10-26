import React, { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from "react";
import { useTextSelection } from "../../hook/useTextSelection";
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Quote,
  Code,
  Link,
  Image,
  Type,
  Palette,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut
} from "lucide-react";
import Button from "../ui/Button";
import "./RichTextEditor.css";

const RichTextEditor = forwardRef((props, ref) => {
  // Handle null props
  if (!props) {
    return null;
  }

  const {
    value,
    onChange,
    placeholder = "Start writing...",
    readOnly = false,
    height = "600px",
    className = "",
  } = props;

  const editorRef = useRef(null);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);

  // Use text selection hook
  const {
    getCurrentRange,
    hasSelection,
    insertAtCursor,
    insertHTMLAtCursor,
    wrapSelection,
    getSelectedText,
    clearSelection,
    focusEditor
  } = useTextSelection();

  // Expose editor element to parent component
  useImperativeHandle(ref, () => ({
    getEditorElement: () => editorRef.current,
    focus: () => editorRef.current?.focus(),
    executeCommand: (command, value = null) => {
      if (editorRef.current) {
        document.execCommand(command, false, value);
        // Trigger content change
        const event = new Event('input', { bubbles: true });
        editorRef.current.dispatchEvent(event);
      }
    },
    insertImage: (src) => {
      if (editorRef.current) {
        const img = document.createElement('img');
        img.src = src;
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        img.style.display = 'block';
        img.style.margin = '10px auto';
        img.alt = 'Inserted image';
        
        // Add error handling for broken images
        img.onerror = () => {
          img.style.border = '2px dashed #ff0000';
          img.style.padding = '10px';
          img.style.backgroundColor = '#ffe6e6';
          img.alt = 'Failed to load image';
          img.title = 'Failed to load image. Please check the URL.';
        };
        
        // Add loading state
        img.onload = () => {
          img.style.border = 'none';
          img.style.backgroundColor = 'transparent';
        };
        
        // Insert at cursor position
        if (insertAtCursor(img)) {
          // Successfully inserted
        } else {
          // Fallback: append to editor
          editorRef.current.appendChild(img);
        }
        
        // Trigger content change
        const event = new Event('input', { bubbles: true });
        editorRef.current.dispatchEvent(event);
      }
    },
    insertLink: (url) => {
      if (editorRef.current) {
        if (hasSelection()) {
          wrapSelection('a', { href: url, target: '_blank', rel: 'noopener noreferrer' });
        } else {
          // Insert link at cursor position
          insertHTMLAtCursor(`<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`);
        }
        
        // Trigger content change
        const event = new Event('input', { bubbles: true });
        editorRef.current.dispatchEvent(event);
      }
    },
    insertTable: (rows, cols) => {
      if (editorRef.current) {
        const table = document.createElement('table');
        table.style.borderCollapse = 'collapse';
        table.style.width = '100%';
        table.style.margin = '20px 0';
        table.style.border = '1px solid #ddd';
        
        for (let i = 0; i < rows; i++) {
          const row = document.createElement('tr');
          for (let j = 0; j < cols; j++) {
            const cell = document.createElement('td');
            cell.style.border = '1px solid #ddd';
            cell.style.padding = '12px';
            cell.style.minWidth = '80px';
            cell.style.minHeight = '30px';
            cell.style.verticalAlign = 'top';
            cell.contentEditable = 'true';
            cell.innerHTML = '&nbsp;';
            
            // Add focus handling for cells
            cell.addEventListener('focus', () => {
              if (cell.innerHTML === '&nbsp;') {
                cell.innerHTML = '';
              }
            });
            
            cell.addEventListener('blur', () => {
              if (cell.innerHTML === '') {
                cell.innerHTML = '&nbsp;';
              }
            });
            
            row.appendChild(cell);
          }
          table.appendChild(row);
        }
        
        // Insert at cursor position
        if (insertAtCursor(table)) {
          // Add a line break after the table
          const br = document.createElement('br');
          insertAtCursor(br);
        } else {
          // Fallback: append to editor
          editorRef.current.appendChild(table);
          // Add line break after table
          const br = document.createElement('br');
          editorRef.current.appendChild(br);
        }
        
        // Focus the first cell
        const firstCell = table.querySelector('td');
        if (firstCell) {
          firstCell.focus();
          firstCell.innerHTML = '';
        }
        
        // Trigger content change
        const event = new Event('input', { bubbles: true });
        editorRef.current.dispatchEvent(event);
      }
    },
    insertUnorderedList: () => {
      if (editorRef.current) {
        const list = document.createElement('ul');
        list.style.margin = '10px 0';
        list.style.paddingLeft = '20px';
        
        // Create a list item
        const listItem = document.createElement('li');
        listItem.style.marginBottom = '5px';
        listItem.innerHTML = '&nbsp;';
        listItem.contentEditable = 'true';
        
        // Handle focus for list items
        listItem.addEventListener('focus', () => {
          if (listItem.innerHTML === '&nbsp;') {
            listItem.innerHTML = '';
          }
        });
        
        listItem.addEventListener('blur', () => {
          if (listItem.innerHTML === '') {
            listItem.innerHTML = '&nbsp;';
          }
        });
        
        // Handle Enter key to create new list items
        listItem.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            const newListItem = document.createElement('li');
            newListItem.style.marginBottom = '5px';
            newListItem.innerHTML = '&nbsp;';
            newListItem.contentEditable = 'true';
            
            // Add the same event listeners
            newListItem.addEventListener('focus', () => {
              if (newListItem.innerHTML === '&nbsp;') {
                newListItem.innerHTML = '';
              }
            });
            
            newListItem.addEventListener('blur', () => {
              if (newListItem.innerHTML === '') {
                newListItem.innerHTML = '&nbsp;';
              }
            });
            
            list.insertBefore(newListItem, listItem.nextSibling);
            newListItem.focus();
            newListItem.innerHTML = '';
          }
        });
        
        list.appendChild(listItem);
        
        // Insert the list at cursor position
        if (insertAtCursor(list)) {
          // Focus the first list item
          listItem.focus();
          listItem.innerHTML = '';
        }
        
        // Trigger content change
        const event = new Event('input', { bubbles: true });
        editorRef.current.dispatchEvent(event);
      }
    },
    insertOrderedList: () => {
      if (editorRef.current) {
        const list = document.createElement('ol');
        list.style.margin = '10px 0';
        list.style.paddingLeft = '20px';
        
        // Create a list item
        const listItem = document.createElement('li');
        listItem.style.marginBottom = '5px';
        listItem.innerHTML = '&nbsp;';
        listItem.contentEditable = 'true';
        
        // Handle focus for list items
        listItem.addEventListener('focus', () => {
          if (listItem.innerHTML === '&nbsp;') {
            listItem.innerHTML = '';
          }
        });
        
        listItem.addEventListener('blur', () => {
          if (listItem.innerHTML === '') {
            listItem.innerHTML = '&nbsp;';
          }
        });
        
        // Handle Enter key to create new list items
        listItem.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            const newListItem = document.createElement('li');
            newListItem.style.marginBottom = '5px';
            newListItem.innerHTML = '&nbsp;';
            newListItem.contentEditable = 'true';
            
            // Add the same event listeners
            newListItem.addEventListener('focus', () => {
              if (newListItem.innerHTML === '&nbsp;') {
                newListItem.innerHTML = '';
              }
            });
            
            newListItem.addEventListener('blur', () => {
              if (newListItem.innerHTML === '') {
                newListItem.innerHTML = '&nbsp;';
              }
            });
            
            list.insertBefore(newListItem, listItem.nextSibling);
            newListItem.focus();
            newListItem.innerHTML = '';
          }
        });
        
        list.appendChild(listItem);
        
        // Insert the list at cursor position
        if (insertAtCursor(list)) {
          // Focus the first list item
          listItem.focus();
          listItem.innerHTML = '';
        }
        
        // Trigger content change
        const event = new Event('input', { bubbles: true });
        editorRef.current.dispatchEvent(event);
      }
    }
  }));

  // Check if global dark mode is enabled and listen for changes
  const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'));

  // Listen for theme changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  // Update content when value prop changes
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value || '';
      
      // Update word and character count
      const textContent = editorRef.current.textContent || '';
      const words = textContent.trim().split(/\s+/).filter(word => word.length > 0);
      setWordCount(words.length);
      setCharCount(textContent.length);
    }
  }, [value]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (readOnly) return;
      
      // Ctrl+B for bold
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        handleBold();
      }
      // Ctrl+I for italic
      if (e.ctrlKey && e.key === 'i') {
        e.preventDefault();
        handleItalic();
      }
      // Ctrl+U for underline
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        handleUnderline();
      }
    };

    if (editorRef.current) {
      editorRef.current.addEventListener('keydown', handleKeyDown);
      return () => {
        if (editorRef.current) {
          editorRef.current.removeEventListener('keydown', handleKeyDown);
        }
      };
    }
  }, [readOnly]);

  // Focus editor on mount
  useEffect(() => {
    if (editorRef.current && !readOnly) {
      editorRef.current.focus();
    }
  }, [readOnly]);

  // Handle paste events
  const handlePaste = useCallback((e) => {
    if (readOnly) {
      e.preventDefault();
      return;
    }
    
    e.preventDefault();
    
    // Get pasted data
    const clipboardData = e.clipboardData || window.clipboardData;
    const pastedData = clipboardData.getData('text/html') || clipboardData.getData('text/plain');
    
    if (editorRef.current) {
      if (insertHTMLAtCursor(pastedData)) {
        onChange(editorRef.current.innerHTML);
      }
    }
  }, [onChange, readOnly]);

  const handleFormat = useCallback((command, value = null) => {
    if (editorRef.current && !readOnly) {
      editorRef.current.focus();
      
      // Handle insertHTML command specially
      if (command === 'insertHTML') {
        insertHTMLAtCursor(value);
      } else {
        document.execCommand(command, false, value);
      }
      
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange, readOnly]);

  const handleBold = () => {
    if (readOnly) return;
    handleFormat('bold');
    setIsBold(!isBold);
  };

  const handleItalic = () => {
    if (readOnly) return;
    handleFormat('italic');
    setIsItalic(!isItalic);
  };

  const handleUnderline = () => {
    if (readOnly) return;
    handleFormat('underline');
    setIsUnderline(!isUnderline);
  };

  const handleStrikethrough = () => {
    handleFormat('strikeThrough');
  };

  const handleAlignLeft = () => {
    handleFormat('justifyLeft');
  };

  const handleAlignCenter = () => {
    handleFormat('justifyCenter');
  };

  const handleAlignRight = () => {
    handleFormat('justifyRight');
  };

  const handleUnorderedList = () => {
    handleFormat('insertUnorderedList');
  };

  const handleOrderedList = () => {
    handleFormat('insertOrderedList');
  };

  const handleBlockquote = () => {
    handleFormat('formatBlock', 'blockquote');
  };

  const handleCode = () => {
    handleFormat('formatBlock', 'pre');
  };

  const handleLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      handleFormat('createLink', url);
    }
  };

  const handleImage = () => {
    if (readOnly) return;
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          // Create image element properly
          const img = `<img src="${event.target.result}" alt="Uploaded image" style="max-width: 100%; height: auto; border-radius: 4px; margin: 8px 0;" />`;
          
          // Insert HTML at cursor position
          if (editorRef.current) {
            if (insertHTMLAtCursor(img)) {
              onChange(editorRef.current.innerHTML);
            }
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleHeading = (level) => {
    handleFormat('formatBlock', `h${level}`);
  };

  const handleColor = () => {
    const color = prompt('Enter color (e.g., #ff0000 or red):');
    if (color) {
      handleFormat('foreColor', color);
    }
  };

  const handleBackgroundColor = () => {
    const color = prompt('Enter background color (e.g., #ffff00 or yellow):');
    if (color) {
      handleFormat('backColor', color);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 10, 50));
  };

  const handleContentChange = useCallback((e) => {
    if (editorRef.current && !readOnly) {
      const content = editorRef.current.innerHTML;
      onChange(content);
      
      // Update word and character count
      const textContent = editorRef.current.textContent || '';
      const words = textContent.trim().split(/\s+/).filter(word => word.length > 0);
      setWordCount(words.length);
      setCharCount(textContent.length);
    }
  }, [onChange, readOnly]);

  // Handle text input properly
  const handleInput = useCallback((e) => {
    if (editorRef.current && !readOnly) {
      const content = editorRef.current.innerHTML;
      onChange(content);
      
      // Update word and character count
      const textContent = editorRef.current.textContent || '';
      const words = textContent.trim().split(/\s+/).filter(word => word.length > 0);
      setWordCount(words.length);
      setCharCount(textContent.length);
    }
  }, [onChange, readOnly]);

  const editorStyle = {
    height: isFullscreen ? "100vh" : height,
    backgroundColor: isDarkMode ? "black" : "white",
    color: isDarkMode ? "#f9fafb" : "#111827",
    transform: `scale(${zoomLevel / 100})`,
    transformOrigin: "top left",
  };

  return (
    <div className={`rich-text-editor ${isDarkMode ? 'dark' : ''} ${isFullscreen ? 'fullscreen' : ''} ${className}`}>
      
      {/* Google Docs-like Toolbar */}

      {/* Editor Content */}
      <div className="editor-content-wrapper">
        <div
          ref={editorRef}
          contentEditable={!readOnly}
          onInput={handleInput}
          onBlur={handleContentChange}
          onPaste={handlePaste}
          onClick={(e) => {
            if (!readOnly && editorRef.current) {
              editorRef.current.focus();
            }
          }}
          className="rich-text-content"
          style={editorStyle}
          data-placeholder={placeholder}
          suppressContentEditableWarning={true}
        />
      </div>

      {/* Enhanced Status Bar */}
      <div className="rich-text-status-bar">
        <div className="status-info">
          <span className="status-item">
            {wordCount} {wordCount === 1 ? 'word' : 'words'}
          </span>
          <span className="status-item">
            {charCount} {charCount === 1 ? 'character' : 'characters'}
          </span>
          <span className="status-item">
            {zoomLevel}% zoom
          </span>
        </div>
        <div className="status-actions">
          {!readOnly && (
            <span className="status-hint">
              Use toolbar to format text • Press Ctrl+B for bold, Ctrl+I for italic
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

export default RichTextEditor;

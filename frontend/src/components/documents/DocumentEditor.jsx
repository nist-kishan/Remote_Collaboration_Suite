import React, { useState, useEffect } from "react";
import { 
  Save, 
  Share, 
  Users, 
  MessageSquare, 
  Eye,
  ArrowLeft,
  MoreVertical,
  Download,
  Settings,
  X,
  File,
  Edit,
  View,
  Plus,
  Type,
  Wrench,
  HelpCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "../ui/Button";
import Input from "../ui/Input";
import RichTextEditor from "../editor/RichTextEditor";
import Card from "../ui/Card";
import Container from "../ui/Container";

const DocumentEditor = ({ 
  document = null, 
  onSave, 
  onShare, 
  onBack,
  loading = false,
  className = "" 
}) => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState("draft");
  const [visibility, setVisibility] = useState("private");
  const [hasChanges, setHasChanges] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    if (document) {
      setTitle(document.title || "");
      setContent(document.content || "");
      setTags(document.tags?.join(", ") || "");
      setStatus(document.status || "draft");
      setVisibility(document.visibility || "private");
      setHasChanges(false);
    } else {
      // Reset form for new document
      setTitle("");
      setContent("");
      setTags("");
      setStatus("draft");
      setVisibility("private");
      setHasChanges(false);
    }
  }, [document]);

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
    setHasChanges(true);
  };

  const handleContentChange = (value) => {
    setContent(value);
    setHasChanges(true);
  };

  const handleTagsChange = (e) => {
    setTags(e.target.value);
    setHasChanges(true);
  };

  const handleStatusChange = (e) => {
    setStatus(e.target.value);
    setHasChanges(true);
  };

  const handleVisibilityChange = (e) => {
    setVisibility(e.target.value);
    setHasChanges(true);
  };

  const handleSave = () => {
    const documentData = {
      title: title.trim(),
      content,
      tags: tags.split(",").map(tag => tag.trim()).filter(tag => tag),
      status,
      visibility,
    };

    onSave(documentData);
    setHasChanges(false);
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1); // Go back to previous page
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${className}`}>
      <Container>
        <div className="py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={handleBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {document ? "Edit Document" : "Create Document"}
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  {document ? "Make changes to your document" : "Start writing your new document"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {document && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => onShare(document)}
                    className="flex items-center gap-2 hidden sm:flex"
                  >
                    <Share className="w-4 h-4" />
                    <span className="hidden md:inline">Share</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 hidden sm:flex"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="hidden md:inline">Preview</span>
                  </Button>
                </>
              )}
              
              <Button
                variant="outline"
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-2 hidden sm:flex"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden md:inline">Settings</span>
              </Button>
              
              <Button
                onClick={handleSave}
                loading={loading}
                disabled={!title.trim() || loading}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span className="hidden sm:inline">{hasChanges ? "Save Changes" : "Saved"}</span>
                <span className="sm:hidden">{hasChanges ? "Save" : "✓"}</span>
              </Button>
            </div>
          </div>

          <div className="flex flex-col h-[calc(100vh-120px)]">
            {/* Google Docs-like Menu Bar */}
            <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 relative">
              {/* Desktop Menu */}
              <div className="hidden md:flex items-center px-4 py-2 space-x-1">
                <div className="relative">
                  <button
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded flex items-center gap-1"
                    onMouseEnter={() => setActiveMenu('file')}
                    onMouseLeave={() => setActiveMenu(null)}
                  >
                    <File className="w-4 h-4" />
                    File
                  </button>
                  {activeMenu === 'file' && (
                    <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 min-w-48 z-50"
                         onMouseEnter={() => setActiveMenu('file')}
                         onMouseLeave={() => setActiveMenu(null)}>
                      <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                        <File className="w-4 h-4" />
                        New document
                      </button>
                      <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                      <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                      <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Document settings
                      </button>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded flex items-center gap-1"
                    onMouseEnter={() => setActiveMenu('edit')}
                    onMouseLeave={() => setActiveMenu(null)}
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  {activeMenu === 'edit' && (
                    <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 min-w-48 z-50"
                         onMouseEnter={() => setActiveMenu('edit')}
                         onMouseLeave={() => setActiveMenu(null)}>
                      <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                        <Edit className="w-4 h-4" />
                        Undo
                      </button>
                      <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                        <Edit className="w-4 h-4" />
                        Redo
                      </button>
                      <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                      <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                        <Edit className="w-4 h-4" />
                        Find and replace
                      </button>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded flex items-center gap-1"
                    onMouseEnter={() => setActiveMenu('view')}
                    onMouseLeave={() => setActiveMenu(null)}
                  >
                    <View className="w-4 h-4" />
                    View
                  </button>
                  {activeMenu === 'view' && (
                    <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 min-w-48 z-50"
                         onMouseEnter={() => setActiveMenu('view')}
                         onMouseLeave={() => setActiveMenu(null)}>
                      <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        Preview
                      </button>
                      <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                        <View className="w-4 h-4" />
                        Print layout
                      </button>
                      <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                      <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Zoom
                      </button>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded flex items-center gap-1"
                    onMouseEnter={() => setActiveMenu('insert')}
                    onMouseLeave={() => setActiveMenu(null)}
                  >
                    <Plus className="w-4 h-4" />
                    Insert
                  </button>
                  {activeMenu === 'insert' && (
                    <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 min-w-48 z-50"
                         onMouseEnter={() => setActiveMenu('insert')}
                         onMouseLeave={() => setActiveMenu(null)}>
                      <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Image
                      </button>
                      <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Link
                      </button>
                      <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Table
                      </button>
                      <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                      <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Comment
                      </button>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded flex items-center gap-1"
                    onMouseEnter={() => setActiveMenu('format')}
                    onMouseLeave={() => setActiveMenu(null)}
                  >
                    <Type className="w-4 h-4" />
                    Format
                  </button>
                  {activeMenu === 'format' && (
                    <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 min-w-48 z-50"
                         onMouseEnter={() => setActiveMenu('format')}
                         onMouseLeave={() => setActiveMenu(null)}>
                      <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                        <Type className="w-4 h-4" />
                        Text
                      </button>
                      <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                        <Type className="w-4 h-4" />
                        Paragraph
                      </button>
                      <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                        <Type className="w-4 h-4" />
                        Columns
                      </button>
                      <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                      <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                        <Type className="w-4 h-4" />
                        Clear formatting
                      </button>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded flex items-center gap-1"
                    onMouseEnter={() => setActiveMenu('tools')}
                    onMouseLeave={() => setActiveMenu(null)}
                  >
                    <Wrench className="w-4 h-4" />
                    Tools
                  </button>
                  {activeMenu === 'tools' && (
                    <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 min-w-48 z-50"
                         onMouseEnter={() => setActiveMenu('tools')}
                         onMouseLeave={() => setActiveMenu(null)}>
                      <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                        <Wrench className="w-4 h-4" />
                        Spelling and grammar
                      </button>
                      <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Share
                      </button>
                      <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                      <button 
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                        onClick={() => setShowSettings(true)}
                      >
                        <Settings className="w-4 h-4" />
                        Document settings
                      </button>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded flex items-center gap-1"
                    onMouseEnter={() => setActiveMenu('help')}
                    onMouseLeave={() => setActiveMenu(null)}
                  >
                    <HelpCircle className="w-4 h-4" />
                    Help
                  </button>
                  {activeMenu === 'help' && (
                    <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 min-w-48 z-50"
                         onMouseEnter={() => setActiveMenu('help')}
                         onMouseLeave={() => setActiveMenu(null)}>
                      <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                        <HelpCircle className="w-4 h-4" />
                        Help center
                      </button>
                      <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                        <HelpCircle className="w-4 h-4" />
                        Keyboard shortcuts
                      </button>
                      <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                      <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                        <HelpCircle className="w-4 h-4" />
                        About
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile Menu */}
              <div className="md:hidden flex items-center justify-between px-4 py-2">
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                >
                  <MoreVertical className="w-4 h-4" />
                  Menu
                </button>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSettings(true)}
                    className="p-2"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Mobile Menu Dropdown */}
              {showMobileMenu && (
                <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                  <div className="grid grid-cols-2 gap-1 p-2">
                    <button className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded flex items-center gap-2">
                      <File className="w-4 h-4" />
                      File
                    </button>
                    <button className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded flex items-center gap-2">
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded flex items-center gap-2">
                      <View className="w-4 h-4" />
                      View
                    </button>
                    <button className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Insert
                    </button>
                    <button className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded flex items-center gap-2">
                      <Type className="w-4 h-4" />
                      Format
                    </button>
                    <button className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded flex items-center gap-2">
                      <Wrench className="w-4 h-4" />
                      Tools
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Google Docs-like Title Bar */}
            <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-3 sm:py-4">
              <Input
                placeholder="Untitled document"
                value={title}
                onChange={handleTitleChange}
                className="text-xl sm:text-2xl font-normal border-none p-0 focus:ring-0 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            {/* Main Editor */}
            <div className="flex-1 bg-white dark:bg-gray-900">
              <RichTextEditor
                value={content}
                onChange={handleContentChange}
                placeholder="Start writing your document..."
                height="100%"
                className="h-full border-none"
              />
            </div>
          </div>
        </div>
      </Container>

      {/* Floating Settings Panel */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Document Settings
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(false)}
                className="p-1"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={status}
                  onChange={handleStatusChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Visibility
                </label>
                <select
                  value={visibility}
                  onChange={handleVisibilityChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="private">Private</option>
                  <option value="shared">Shared</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tags
                </label>
                <Input
                  placeholder="Enter tags separated by commas"
                  value={tags}
                  onChange={handleTagsChange}
                />
              </div>

              {document && document.collaborators && document.collaborators.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Collaborators ({document.collaborators.length})
                  </label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {document.collaborators.map((collaborator, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                        <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm">
                          {collaborator.user?.name?.charAt(0) || "U"}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-800 dark:text-gray-100">
                            {collaborator.user?.name || "Unknown User"}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {collaborator.role}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentEditor;

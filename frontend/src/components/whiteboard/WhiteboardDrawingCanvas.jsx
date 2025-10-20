import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWhiteboard } from '../../hook/useWhiteboard';
import WhiteboardDrawingToolbar from './WhiteboardDrawingToolbar';
import WhiteboardMobileToolbar from './WhiteboardMobileToolbar';
import WhiteboardCollaborationChat from './WhiteboardCollaborationChat';

const WhiteboardCanvas = ({ 
  whiteboard, 
  onSave, 
  onShare, 
  socket,
  loading = false,
  className = "" 
}) => {
  const navigate = useNavigate();
  const {
    // Refs
    canvasRef,
    
    // State
    currentTool,
    brushSize,
    brushColor,
    activeUsers,
    brushOpacity,
    smoothing,
    showChat,
    textColor,
    fillColor,
    showTextColorPicker,
    showFillColorPicker,
    chatMessages,
    showMobileMenu,
    showBrushSettings,
    newMessage,
    fabricLoaded,
    
    // Permissions
    canEdit,
    
    // Setters
    setBrushSize,
    setBrushColor,
    setBrushOpacity,
    setSmoothing,
    setShowChat,
    setTextColor,
    setFillColor,
    setShowTextColorPicker,
    setShowFillColorPicker,
    setShowMobileMenu,
    setShowBrushSettings,
    setNewMessage,
    
    // Handlers
    handleToolChange,
    handleShapeCreation,
    handleTextCreation,
    handleUndo,
    handleRedo,
    handleDeleteSelected,
    handleSave,
    handleSendMessage,
  } = useWhiteboard(whiteboard?._id, { whiteboard, onSave, socket });

  // Show loading state while Fabric.js is loading
  if (!fabricLoaded) {
    return (
      <div className="flex flex-col h-full bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-indigo-950">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-200 dark:border-indigo-900"></div>
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-indigo-600 absolute top-0 left-0"></div>
            </div>
            <span className="ml-3 text-gray-700 dark:text-gray-300 font-medium">Loading canvas...</span>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-6">
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 opacity-20 animate-pulse"></div>
              <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-white dark:bg-gray-800 shadow-xl">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 dark:border-indigo-900"></div>
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-600 absolute"></div>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Initializing Whiteboard</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Preparing your creative canvas...</p>
            </div>
            <div className="flex gap-2 justify-center">
              <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-pink-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if whiteboard is not available
  if (!whiteboard) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-red-950 dark:to-gray-900">
        <div className="text-center space-y-6 p-8">
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-500 to-orange-500 opacity-20 animate-pulse"></div>
            <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-white dark:bg-gray-800 shadow-xl">
              <svg className="w-12 h-12 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              Whiteboard Not Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md">
              The whiteboard you're trying to access doesn't exist or you don't have permission to view it.
            </p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="flex-shrink-0">
        <WhiteboardDrawingToolbar
          whiteboard={whiteboard}
          currentTool={currentTool}
          brushSize={brushSize}
          brushColor={brushColor}
          brushOpacity={brushOpacity}
          smoothing={smoothing}
          textColor={textColor}
          fillColor={fillColor}
          showTextColorPicker={showTextColorPicker}
          showFillColorPicker={showFillColorPicker}
          canEdit={canEdit}
          loading={loading}
          showMobileMenu={showMobileMenu}
          onToolChange={handleToolChange}
          onShapeCreation={handleShapeCreation}
          onTextCreation={handleTextCreation}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onDeleteSelected={handleDeleteSelected}
          onSave={handleSave}
          onShare={onShare}
          onChatToggle={() => setShowChat(!showChat)}
          onBrushSizeChange={setBrushSize}
          onBrushColorChange={setBrushColor}
          onBrushOpacityChange={setBrushOpacity}
          onSmoothingChange={setSmoothing}
          onTextColorChange={setTextColor}
          onFillColorChange={setFillColor}
          onTextColorPickerToggle={() => setShowTextColorPicker(!showTextColorPicker)}
          onFillColorPickerToggle={() => setShowFillColorPicker(!showFillColorPicker)}
          onMobileMenuToggle={() => setShowMobileMenu(!showMobileMenu)}
        />

        {/* Mobile Menu */}
        {showMobileMenu && (
          <WhiteboardMobileToolbar
            whiteboard={whiteboard}
            currentTool={currentTool}
            brushSize={brushSize}
            brushColor={brushColor}
            brushOpacity={brushOpacity}
            smoothing={smoothing}
            textColor={textColor}
            fillColor={fillColor}
            showBrushSettings={showBrushSettings}
            canEdit={canEdit}
            loading={loading}
            onToolChange={handleToolChange}
            onShapeCreation={handleShapeCreation}
            onTextCreation={handleTextCreation}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onDeleteSelected={handleDeleteSelected}
            onSave={handleSave}
            onShare={onShare}
            onChatToggle={() => setShowChat(!showChat)}
            onBrushSettingsToggle={() => setShowBrushSettings(!showBrushSettings)}
            onBrushSizeChange={setBrushSize}
            onBrushColorChange={setBrushColor}
            onBrushOpacityChange={setBrushOpacity}
            onSmoothingChange={setSmoothing}
            onTextColorChange={setTextColor}
            onFillColorChange={setFillColor}
            onMobileMenuClose={() => setShowMobileMenu(false)}
          />
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 relative min-h-[600px] overflow-auto">
          <canvas
            ref={canvasRef}
            className="border border-gray-200 dark:border-gray-700"
            style={{
              cursor: canEdit ? (currentTool === 'eraser' ? 'crosshair' : 'crosshair') : 'default',
              width: '100%',
              height: '100%',
              display: 'block'
            }}
          />
          
          {/* Active Users Cursors */}
          {activeUsers.map((user) => (
            <div
              key={user.id}
              className="absolute pointer-events-none z-10"
              style={{
                left: user.cursor?.x || 0,
                top: user.cursor?.y || 0,
              }}
            >
              <div className="flex items-center gap-1 bg-white dark:bg-gray-800 px-2 py-1 rounded shadow-lg border">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: user.color || '#3B82F6' }}
                />
                <span className="text-xs font-medium text-gray-900 dark:text-white">
                  {user.name}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Chat Panel */}
        <WhiteboardCollaborationChat
          showChat={showChat}
          chatMessages={chatMessages}
          newMessage={newMessage}
          onClose={() => setShowChat(false)}
          onMessageChange={setNewMessage}
          onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  );
};

export default WhiteboardCanvas;

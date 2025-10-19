# Redux-Based Chat Architecture

## Overview
The chat functionality has been refactored to use Redux for state management and React Query for data fetching, providing better separation of concerns between UI and business logic.

## Architecture Components

### 1. Redux Store (`frontend/src/store/slice/chatSlice.js`)

#### **State Structure:**
```javascript
{
  // Data
  chats: [],
  groupChats: [],
  oneToOneChats: [],
  chattedUsers: [],
  currentChat: null,
  currentChatMessages: [],
  groupMembers: [],
  
  // UI State
  selectedChatId: null,
  showCreateGroupModal: false,
  showNewChatModal: false,
  showGroupMembersModal: false,
  
  // Loading States
  loading: {
    chats: false,
    groupChats: false,
    // ... other loading states
  },
  
  // Error States
  errors: {
    chats: null,
    groupChats: null,
    // ... other error states
  },
  
  // Pagination
  pagination: {
    chats: { page: 1, limit: 20, total: 0, pages: 0 },
    // ... other pagination states
  }
}
```

#### **Async Thunks:**
- `fetchUserChats` - Fetch all user chats
- `fetchGroupChats` - Fetch group chats only
- `fetchOneToOneChats` - Fetch one-to-one chats only
- `fetchChattedUsers` - Fetch chatted users and groups
- `fetchChatById` - Fetch specific chat by ID
- `createGroupChatAction` - Create new group chat
- `updateGroupChatAction` - Update group chat details
- `addGroupMembersAction` - Add members to group
- `removeGroupMemberAction` - Remove member from group
- `updateMemberRoleAction` - Update member role
- `leaveGroupAction` - Leave group
- `archiveChatAction` - Archive chat
- `unarchiveChatAction` - Unarchive chat
- `fetchGroupMembers` - Fetch group members

#### **Reducers:**
- `setSelectedChatId` - Set currently selected chat ID
- `setCurrentChat` - Set current chat object
- `setCurrentChatMessages` - Set current chat messages
- `addMessageToCurrentChat` - Add message to current chat
- `updateMessageInCurrentChat` - Update message in current chat
- `removeMessageFromCurrentChat` - Remove message from current chat
- `setShowCreateGroupModal` - Toggle create group modal
- `setShowNewChatModal` - Toggle new chat modal
- `setShowGroupMembersModal` - Toggle group members modal
- `clearError` - Clear specific error
- `clearAllErrors` - Clear all errors
- `resetChatState` - Reset entire chat state

#### **Selectors:**
- `selectChats` - Get all chats
- `selectGroupChats` - Get group chats
- `selectOneToOneChats` - Get one-to-one chats
- `selectChattedUsers` - Get chatted users
- `selectCurrentChat` - Get current chat
- `selectCurrentChatMessages` - Get current chat messages
- `selectSelectedChatId` - Get selected chat ID
- `selectGroupMembers` - Get group members
- `selectIsAdmin` - Get admin status
- `selectUserRole` - Get user role
- `selectShowCreateGroupModal` - Get create group modal state
- `selectShowNewChatModal` - Get new chat modal state
- `selectShowGroupMembersModal` - Get group members modal state
- `selectChatLoading` - Get loading states
- `selectChatErrors` - Get error states
- `selectChatPagination` - Get pagination states

### 2. Custom Hooks (`frontend/src/hook/useChatManager.js`)

#### **Main Hook: `useChatManager`**
Provides centralized access to all chat state and actions:
```javascript
const {
  // State
  chats, groupChats, oneToOneChats, chattedUsers,
  currentChat, selectedChatId, groupMembers,
  isAdmin, userRole, showCreateGroupModal,
  showNewChatModal, showGroupMembersModal,
  loading, errors, pagination,
  
  // Actions
  selectChat, openCreateGroupModal, closeCreateGroupModal,
  openNewChatModal, closeNewChatModal, openGroupMembersModal,
  closeGroupMembersModal, addMessage, updateMessage,
  removeMessage, clearChatError
} = useChatManager();
```

#### **Query Hooks:**
- `useChatsQuery(params)` - Fetch user chats with React Query
- `useGroupChatsQuery(params)` - Fetch group chats with React Query
- `useOneToOneChatsQuery(params)` - Fetch one-to-one chats with React Query
- `useChattedUsersQuery(params)` - Fetch chatted users with React Query
- `useChatQuery(chatId)` - Fetch specific chat with React Query
- `useGroupMembersQuery(chatId)` - Fetch group members with React Query

#### **Mutation Hooks:**
- `useCreateGroupChat()` - Create group chat mutation
- `useUpdateGroupChat()` - Update group chat mutation
- `useAddGroupMembers()` - Add group members mutation
- `useRemoveGroupMember()` - Remove group member mutation
- `useUpdateMemberRole()` - Update member role mutation
- `useLeaveGroup()` - Leave group mutation
- `useArchiveChat()` - Archive chat mutation
- `useUnarchiveChat()` - Unarchive chat mutation
- `useCreateOneToOneChat()` - Create one-to-one chat mutation

### 3. Updated Components

#### **ChatPage (`frontend/src/pages/ChatPageRedux.jsx`)**
- Uses `useChatManager` for state management
- Uses Redux-based mutations for API calls
- Separates UI logic from business logic
- Cleaner component structure

#### **GroupMembersModal (`frontend/src/components/chat/GroupMembersModal.jsx`)**
- Uses Redux-based hooks for data fetching
- Uses Redux-based mutations for member management
- Automatic state updates through Redux

## Benefits of This Architecture

### 1. **Separation of Concerns**
- **UI Components**: Focus only on rendering and user interactions
- **Redux Store**: Manages application state and business logic
- **Custom Hooks**: Provide clean interface between components and Redux
- **API Layer**: Handles data fetching and caching

### 2. **Centralized State Management**
- Single source of truth for all chat-related state
- Predictable state updates through Redux actions
- Easy debugging with Redux DevTools
- Consistent state across all components

### 3. **Better Performance**
- React Query handles caching and background updates
- Redux prevents unnecessary re-renders
- Optimized selectors for component subscriptions
- Efficient state updates

### 4. **Improved Developer Experience**
- Type-safe state management
- Clear data flow patterns
- Easy testing with isolated reducers
- Better error handling and loading states

### 5. **Scalability**
- Easy to add new features
- Modular architecture
- Reusable hooks and components
- Maintainable codebase

## Usage Examples

### **Using Chat Manager Hook:**
```javascript
import { useChatManager } from '../hook/useChatManager';

const MyComponent = () => {
  const {
    currentChat,
    selectChat,
    openCreateGroupModal,
    loading,
    errors
  } = useChatManager();

  return (
    <div>
      {loading.chats && <div>Loading...</div>}
      {errors.chats && <div>Error: {errors.chats}</div>}
      <button onClick={openCreateGroupModal}>
        Create Group
      </button>
    </div>
  );
};
```

### **Using Query Hooks:**
```javascript
import { useChatsQuery } from '../hook/useChatManager';

const ChatList = () => {
  const { data: chats, isLoading, error } = useChatsQuery({
    page: 1,
    limit: 20
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {chats?.map(chat => (
        <div key={chat._id}>{chat.name}</div>
      ))}
    </div>
  );
};
```

### **Using Mutation Hooks:**
```javascript
import { useCreateGroupChat } from '../hook/useChatManager';

const CreateGroupForm = () => {
  const createGroup = useCreateGroupChat();

  const handleSubmit = (data) => {
    createGroup.mutate(data, {
      onSuccess: () => {
        toast.success('Group created!');
      },
      onError: (error) => {
        toast.error(error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
    </form>
  );
};
```

## Migration Guide

### **From Old Architecture:**
1. Replace `useState` with Redux state
2. Replace `useMutation` with Redux-based mutation hooks
3. Replace direct API calls with Redux actions
4. Use selectors instead of local state

### **Before (Old Architecture):**
```javascript
const [chats, setChats] = useState([]);
const [loading, setLoading] = useState(false);

const fetchChats = async () => {
  setLoading(true);
  try {
    const response = await getUserChats();
    setChats(response.data);
  } catch (error) {
    console.error(error);
  } finally {
    setLoading(false);
  }
};
```

### **After (Redux Architecture):**
```javascript
const { chats, loading } = useChatManager();
const { data } = useChatsQuery();

// No manual state management needed!
// Redux handles everything automatically
```

This architecture provides a robust, scalable, and maintainable foundation for the chat functionality while keeping UI components clean and focused on their primary responsibility of rendering user interfaces.

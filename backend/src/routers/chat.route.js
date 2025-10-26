import express from 'express';
import {
  getUserChats,
  getChatById,
  getOrCreateOneToOneChat,
  createGroupChat,
  updateGroupChat,
  addGroupMembers,
  removeGroupMember,
  leaveGroup,
  archiveChat,
  unarchiveChat,
  deleteChat,
  archiveChatForUser,
  unarchiveChatForUser,
  deleteChatForUser,
  restoreChatForUser,
  getArchivedChatsForUser,
  getDeletedChatsForUser,
  getChattedUsers,
  getRecentChats,
  getGroupMembers,
  updateMemberRole
} from '../controllers/chat.controller.js';
import {
  sendMessage,
  getChatMessages,
  editMessage,
  deleteMessage,
  addReaction,
  removeReaction,
  markAsRead,
  markAsDelivered,
  getReadReceipts,
  getUnreadCount,
  getTotalUnreadCount,
  uploadFile
} from '../controllers/message.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/multer.middleware.js';

const router = express.Router();

// Chat routes
router.get('/', verifyToken, getUserChats);
router.get('/recent', verifyToken, getRecentChats);
router.get('/chatted-users', verifyToken, getChattedUsers);
router.get('/one-to-one/:otherUserId', verifyToken, getOrCreateOneToOneChat);
router.post('/group', verifyToken, createGroupChat);
router.put('/group/:chatId', verifyToken, updateGroupChat);
router.post('/group/:chatId/members', verifyToken, addGroupMembers);
router.delete('/group/:chatId/members/:memberId', verifyToken, removeGroupMember);
router.put('/group/:chatId/members/:memberId/role', verifyToken, updateMemberRole);
router.post('/group/:chatId/leave', verifyToken, leaveGroup);
router.get('/group/:chatId/members', verifyToken, getGroupMembers);
router.post('/:chatId/archive', verifyToken, archiveChat);
router.post('/:chatId/unarchive', verifyToken, unarchiveChat);
router.delete('/:chatId', verifyToken, deleteChat);

// User-specific chat operations (soft delete/archive)
router.post('/:chatId/archive-user', verifyToken, archiveChatForUser);
router.post('/:chatId/unarchive-user', verifyToken, unarchiveChatForUser);
router.post('/:chatId/delete-user', verifyToken, deleteChatForUser);
router.post('/:chatId/restore-user', verifyToken, restoreChatForUser);

// Get archived and deleted chats for user
router.get('/archived', verifyToken, getArchivedChatsForUser);
router.get('/deleted', verifyToken, getDeletedChatsForUser);

// Message routes
router.post('/:chatId/msg', verifyToken, sendMessage);
router.post('/:chatId/upload', verifyToken, upload.single('file'), uploadFile);
router.get('/:chatId/msg', verifyToken, getChatMessages);
router.put('/:chatId/msg/:messageId', verifyToken, editMessage);
router.delete('/:chatId/msg/:messageId', verifyToken, deleteMessage);
router.post('/:chatId/msg/:messageId/reaction', verifyToken, addReaction);
router.delete('/:chatId/msg/:messageId/reaction', verifyToken, removeReaction);
router.post('/:chatId/read', verifyToken, markAsRead);
router.post('/:chatId/msg/:messageId/delivered', verifyToken, markAsDelivered);
router.get('/:chatId/msg/:messageId/receipts', verifyToken, getReadReceipts);
router.get('/:chatId/unread-count', verifyToken, getUnreadCount);
router.get('/unread-count/total', verifyToken, getTotalUnreadCount);

// Generic chat route - must be last to avoid conflicts
router.get('/:chatId', verifyToken, getChatById);

export { router as chatRouter };


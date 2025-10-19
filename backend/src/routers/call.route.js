import express from 'express';
import {
  startCall,
  joinCall,
  endCall,
  getCallHistory,
  updateCallSettings,
  rejectCall,
  markCallAsMissed,
  cleanupMissedCalls,
  debugCallStatus,
  getCallById,
  deleteCall,
  clearCallHistory
} from '../controllers/call.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/start', verifyToken, startCall);
router.post('/:callId/join', verifyToken, joinCall);
router.post('/:callId/end', verifyToken, endCall);
router.get('/history', verifyToken, getCallHistory);
router.delete('/history', verifyToken, clearCallHistory);
router.get('/:callId', verifyToken, getCallById);
router.put('/:callId/settings', verifyToken, updateCallSettings);
router.post('/:callId/reject', verifyToken, rejectCall);
router.delete('/:callId', verifyToken, deleteCall);

// Missed call management routes
router.post('/:callId/missed', verifyToken, markCallAsMissed);
router.post('/cleanup-missed', verifyToken, cleanupMissedCalls);

// Debug routes
router.get('/debug/:callId', verifyToken, debugCallStatus);

export { router as callRouter };


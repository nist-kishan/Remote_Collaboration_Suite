/**
 * Database retry utility for handling MongoDB connection issues
 */
import mongoose from 'mongoose';

export const withRetry = async (operation, maxRetries = 3, delay = 2000) => {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Check if MongoDB is connected before attempting operation
      if (mongoose.connection.readyState !== 1) {
        await new Promise(resolve => {
          if (mongoose.connection.readyState === 1) {
            resolve();
          } else {
            mongoose.connection.once('connected', resolve);
          }
        });
      }
      
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Check if it's a retryable error
      const isRetryableError = 
        error.name === 'MongoNetworkError' ||
        error.name === 'MongoServerSelectionError' ||
        error.name === 'MongoTimeoutError' ||
        error.message.includes('bufferCommands') ||
        error.code === 'ECONNRESET' ||
        error.code === 'ETIMEDOUT';
      
      if (!isRetryableError || attempt === maxRetries - 1) {
        throw error;
      }
      
      
      // Wait before retrying with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * (attempt + 1)));
    }
  }
  
  throw lastError;
};

export const retryableUserUpdate = async (userId, updateData) => {
  const User = (await import('../models/user.model.js')).default;
  
  return withRetry(async () => {
    return await User.findByIdAndUpdate(userId, updateData, { new: true });
  });
};

export const retryableUserFind = async (userId) => {
  const User = (await import('../models/user.model.js')).default;
  
  return withRetry(async () => {
    return await User.findById(userId);
  });
};

export const retryableChatUpdate = async (chatId, updateData) => {
  const Chat = (await import('../models/chat.model.js')).default;
  
  return withRetry(async () => {
    return await Chat.findByIdAndUpdate(chatId, updateData, { new: true });
  });
};

export const retryableMessageCreate = async (messageData) => {
  const Message = (await import('../models/Message.model.js')).default;
  
  return withRetry(async () => {
    return await Message.create(messageData);
  });
};

export const retryableMessageFind = async (query, options = {}) => {
  const Message = (await import('../models/Message.model.js')).default;
  
  return withRetry(async () => {
    return await Message.find(query, null, options);
  });
};

// Connection status check utility
export const waitForConnection = async (maxWaitTime = parseInt(process.env.DB_CONNECTION_TIMEOUT) || 30000) => {
  const startTime = Date.now();
  
  while (mongoose.connection.readyState !== 1) {
    if (Date.now() - startTime > maxWaitTime) {
      throw new Error('MongoDB connection timeout - database not ready');
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return true;
};

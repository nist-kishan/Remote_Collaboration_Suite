/**
 * Message optimization utilities for faster text and media messaging
 */

// Message queue for batching and optimization
export class MessageQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.batchSize = 5;
    this.batchDelay = 100; // 100ms delay for batching
    this.timeoutId = null;
  }

  // Add message to queue
  addMessage(message, callback) {
    this.queue.push({ message, callback, timestamp: Date.now() });
    
    // Clear existing timeout
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    
    // Process immediately if queue is full, otherwise wait for batch delay
    if (this.queue.length >= this.batchSize) {
      this.processQueue();
    } else {
      this.timeoutId = setTimeout(() => {
        this.processQueue();
      }, this.batchDelay);
    }
  }

  // Process queued messages
  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;
    
    this.isProcessing = true;
    const batch = this.queue.splice(0, this.batchSize);
    
    try {
      // Process messages in parallel
      await Promise.all(batch.map(async ({ message, callback }) => {
        try {
          await callback(message);
        } catch (error) {
          // Message processing error
        }
      }));
    } finally {
      this.isProcessing = false;
      
      // Process remaining messages if any
      if (this.queue.length > 0) {
        setTimeout(() => this.processQueue(), this.batchDelay);
      }
    }
  }

  // Clear queue
  clear() {
    this.queue = [];
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}

// Text message optimization
export class TextMessageOptimizer {
  constructor() {
    this.cache = new Map();
    this.maxCacheSize = 100;
  }

  // Optimize text content
  optimizeText(content) {
    if (!content || typeof content !== 'string') return content;
    
    // Remove extra whitespace
    const optimized = content.trim().replace(/\s+/g, ' ');
    
    // Cache optimization result
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(content, optimized);
    return optimized;
  }

  // Check if text is valid
  validateText(content) {
    if (!content || typeof content !== 'string') {
      return { valid: false, error: 'Invalid text content' };
    }
    
    const trimmed = content.trim();
    if (trimmed.length === 0) {
      return { valid: false, error: 'Text cannot be empty' };
    }
    
    if (trimmed.length > 4000) {
      return { valid: false, error: 'Text too long (max 4000 characters)' };
    }
    
    return { valid: true, content: trimmed };
  }

  // Preprocess text for sending
  preprocessText(content) {
    const validation = this.validateText(content);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    return this.optimizeText(validation.content);
  }
}

// Message sending optimizer
export class MessageSendingOptimizer {
  constructor() {
    this.textOptimizer = new TextMessageOptimizer();
    this.messageQueue = new MessageQueue();
    this.retryQueue = new Map();
    this.maxRetries = 3;
    this.retryDelay = 1000;
  }

  // Optimize message before sending
  optimizeMessage(message) {
    const optimized = { ...message };
    
    // Optimize text content
    if (optimized.content) {
      optimized.content = this.textOptimizer.preprocessText(optimized.content);
    }
    
    // Add timestamp
    optimized.timestamp = Date.now();
    
    // Add unique ID for tracking
    optimized.id = optimized.id || this.generateMessageId();
    
    return optimized;
  }

  // Generate unique message ID
  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Send message with optimization
  async sendMessage(message, sendFunction) {
    const optimizedMessage = this.optimizeMessage(message);
    
    return new Promise((resolve, reject) => {
      const sendWithRetry = async (msg, retryCount = 0) => {
        try {
          const result = await sendFunction(msg);
          resolve(result);
        } catch (error) {
          if (retryCount < this.maxRetries) {
            // Message send failed, retrying...
            
            // Add to retry queue
            setTimeout(() => {
              sendWithRetry(msg, retryCount + 1);
            }, this.retryDelay * (retryCount + 1));
          } else {
            // Message send failed after max retries
            reject(error);
          }
        }
      };
      
      sendWithRetry(optimizedMessage);
    });
  }

  // Batch send messages
  async sendMessages(messages, sendFunction) {
    const optimizedMessages = messages.map(msg => this.optimizeMessage(msg));
    
    // Send in parallel with concurrency limit
    const concurrencyLimit = 3;
    const results = [];
    
    for (let i = 0; i < optimizedMessages.length; i += concurrencyLimit) {
      const batch = optimizedMessages.slice(i, i + concurrencyLimit);
      const batchResults = await Promise.all(
        batch.map(msg => this.sendMessage(msg, sendFunction))
      );
      results.push(...batchResults);
    }
    
    return results;
  }

  // Queue message for batch processing
  queueMessage(message, sendFunction) {
    this.messageQueue.addMessage(message, (msg) => this.sendMessage(msg, sendFunction));
  }

  // Clear queues
  clear() {
    this.messageQueue.clear();
    this.retryQueue.clear();
  }
}

// Typing optimization
export class TypingOptimizer {
  constructor() {
    this.typingTimeout = null;
    this.typingDelay = 300; // 300ms delay
    this.isTyping = false;
    this.callbacks = new Set();
  }

  // Start typing with debounce
  startTyping(callback) {
    this.callbacks.add(callback);
    
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
    
    if (!this.isTyping) {
      this.isTyping = true;
      this.notifyCallbacks(true);
    }
    
    this.typingTimeout = setTimeout(() => {
      this.stopTyping();
    }, this.typingDelay);
  }

  // Stop typing
  stopTyping() {
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
      this.typingTimeout = null;
    }
    
    if (this.isTyping) {
      this.isTyping = false;
      this.notifyCallbacks(false);
    }
  }

  // Notify all callbacks
  notifyCallbacks(typing) {
    this.callbacks.forEach(callback => {
      try {
        callback(typing);
      } catch (error) {
        // Typing callback error
      }
    });
  }

  // Add typing callback
  addCallback(callback) {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  // Clear all callbacks
  clear() {
    this.callbacks.clear();
    this.stopTyping();
  }
}

// Message validation
export const validateMessage = (message) => {
  const errors = [];
  
  if (!message) {
    errors.push('Message is required');
    return { valid: false, errors };
  }
  
  // Check content
  if (!message.content && !message.media && !message.replyTo) {
    errors.push('Message must have content, media, or reply');
  }
  
  // Check content length
  if (message.content && message.content.length > 4000) {
    errors.push('Message content too long (max 4000 characters)');
  }
  
  // Check media
  if (message.media && !Array.isArray(message.media)) {
    errors.push('Media must be an array');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};


// Create optimized message sender
export const createOptimizedMessageSender = () => {
  return {
    textOptimizer: new TextMessageOptimizer(),
    messageOptimizer: new MessageSendingOptimizer(),
    typingOptimizer: new TypingOptimizer()
  };
};

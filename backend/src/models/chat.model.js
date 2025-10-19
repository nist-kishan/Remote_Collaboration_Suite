import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    lastSeen: {
      type: Date,
      default: Date.now
    }
  }],
  type: {
    type: String,
    enum: ['one-to-one', 'group'],
    required: true
  },
  name: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  avatar: {
    type: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastMessageAt: {
    type: Date
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: new Map()
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  isMuted: {
    type: Map,
    of: Boolean,
    default: new Map()
  },
  // User-specific visibility settings
  userVisibility: {
    type: Map,
    of: {
      isHidden: {
        type: Boolean,
        default: false
      },
      isArchived: {
        type: Boolean,
        default: false
      },
      isDeleted: {
        type: Boolean,
        default: false
      },
      hiddenAt: Date,
      archivedAt: Date,
      deletedAt: Date
    },
    default: new Map()
  }
}, {
  timestamps: true
});

// Index for efficient querying
chatSchema.index({ 'participants.user': 1, updatedAt: -1 });
chatSchema.index({ type: 1, updatedAt: -1 });

export default mongoose.model('Chat', chatSchema);

import mongoose from 'mongoose';

const callSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['one-to-one', 'group'],
    required: true
  },
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat'
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    leftAt: Date,
    duration: Number, // in seconds
    status: {
      type: String,
      enum: ['invited', 'joined', 'left', 'missed', 'rejected'],
      default: 'invited'
    },
    videoEnabled: {
      type: Boolean,
      default: true
    },
    screenSharing: {
      type: Boolean,
      default: false
    }
  }],
  startedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: Date,
  duration: {
    type: Number, // in seconds
    default: 0
  },
  status: {
    type: String,
    enum: ['ringing', 'ongoing', 'ended', 'missed', 'rejected'],
    default: 'ringing'
  },
  recordingUrl: {
    type: String
  },
  recordingEnabled: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
callSchema.index({ 'participants.user': 1, startedAt: -1 });
callSchema.index({ chat: 1, startedAt: -1 });
callSchema.index({ status: 1 });

export default mongoose.model('Call', callSchema);


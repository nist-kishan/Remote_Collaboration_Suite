import mongoose from "mongoose";

const meetingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Meeting title is required"],
      trim: true,
      maxlength: [200, "Meeting title cannot exceed 200 characters"]
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"]
    },
    meetingType: {
      type: String,
      enum: ["instant", "scheduled"],
      default: "instant"
    },
    accessType: {
      type: String,
      enum: ["public", "protected"],
      default: "protected"
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: false // Optional for instant meetings
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    attendees: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
      role: {
        type: String,
        enum: ["host", "participant", "viewer"],
        default: "participant"
      },
      status: {
        type: String,
        enum: ["invited", "joined", "declined", "left"],
        default: "invited"
      },
      joinedAt: Date,
      leftAt: Date
    }],
    startTime: {
      type: Date,
      required: function() {
        return this.meetingType === "scheduled";
      }
    },
    endTime: {
      type: Date,
      required: function() {
        return this.meetingType === "scheduled";
      }
    },
    meetingLink: {
      type: String,
      unique: true,
      trim: true
    },
    meetingUrl: {
      type: String,
      trim: true
    },
    meetingId: {
      type: String,
      unique: true,
      trim: true
    },
    password: {
      type: String,
      trim: true,
      required: function() {
        return this.accessType === "protected";
      }
    },
    maxParticipants: {
      type: Number,
      default: 50
    },
    currentParticipants: {
      type: Number,
      default: 0
    },
    agenda: [{
      item: {
        type: String,
        required: true,
        maxlength: [500, "Agenda item cannot exceed 500 characters"]
      },
      duration: Number, // in minutes
      presenter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    }],
    minutes: {
      content: String,
      recordedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      recordedAt: Date
    },
    attachments: [{
      name: String,
      url: String,
      uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }],
    status: {
      type: String,
      enum: ["waiting", "in_progress", "completed", "cancelled"],
      default: "waiting"
    },
    type: {
      type: String,
      enum: ["team_meeting", "client_meeting", "review", "planning", "standup", "other"],
      default: "other"
    },
    recurring: {
      isRecurring: {
        type: Boolean,
        default: false
      },
      frequency: {
        type: String,
        enum: ["daily", "weekly", "monthly", "yearly"]
      },
      interval: {
        type: Number,
        default: 1
      },
      endDate: Date,
      occurrences: Number
    },
    reminders: [{
      type: {
        type: String,
        enum: ["email", "notification", "sms"],
        default: "email"
      },
      time: {
        type: Number, // minutes before meeting
        default: 15
      },
      sent: {
        type: Boolean,
        default: false
      }
    }],
    settings: {
      enableChat: {
        type: Boolean,
        default: true
      },
      enableScreenShare: {
        type: Boolean,
        default: true
      },
      enableRecording: {
        type: Boolean,
        default: false
      },
      muteOnJoin: {
        type: Boolean,
        default: false
      },
      videoOnJoin: {
        type: Boolean,
        default: true
      }
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes
meetingSchema.index({ project: 1 });
meetingSchema.index({ organizer: 1 });
meetingSchema.index({ "attendees.user": 1 });
meetingSchema.index({ startTime: 1, endTime: 1 });
meetingSchema.index({ status: 1 });

// Virtual for duration in minutes
meetingSchema.virtual("duration").get(function() {
  if (!this.startTime || !this.endTime) return 0;
  return Math.round((this.endTime - this.startTime) / (1000 * 60));
});

// Virtual for attendee count
meetingSchema.virtual("attendeeCount").get(function() {
  return this.attendees.length;
});

// Virtual for accepted attendees
meetingSchema.virtual("acceptedAttendees").get(function() {
  return this.attendees.filter(attendee => attendee.status === "accepted");
});

// Virtual for meeting status
meetingSchema.virtual("meetingStatus").get(function() {
  const now = new Date();
  if (this.status === "cancelled" || this.status === "postponed") {
    return this.status;
  }
  if (now < this.startTime) {
    return "upcoming";
  }
  if (now >= this.startTime && now <= this.endTime) {
    return "ongoing";
  }
  if (now > this.endTime) {
    return "completed";
  }
  return "unknown";
});

// Ensure virtual fields are serialized
meetingSchema.set("toJSON", { virtuals: true });
meetingSchema.set("toObject", { virtuals: true });

// Pre-save middleware
meetingSchema.pre("save", function(next) {
  // Generate unique meeting ID and link if not provided
  if (!this.meetingId) {
    this.meetingId = `MTG-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
  
  if (!this.meetingLink) {
    this.meetingLink = `/meeting/${this.meetingId}`;
  }
  
  // For instant meetings, set start time to now
  if (this.meetingType === "instant" && !this.startTime) {
    this.startTime = new Date();
  }
  
  // For instant meetings, set end time to 1 hour from now
  if (this.meetingType === "instant" && !this.endTime) {
    this.endTime = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  }
  
  // Validate end time for scheduled meetings
  if (this.meetingType === "scheduled" && this.endTime <= this.startTime) {
    return next(new Error("End time must be after start time"));
  }
  
  // Set default reminders if none provided
  if (this.reminders.length === 0 && this.meetingType === "scheduled") {
    this.reminders = [
      { type: "email", time: 15, sent: false },
      { type: "notification", time: 5, sent: false }
    ];
  }
  
  next();
});

// Method to check if user can manage meeting
meetingSchema.methods.canBeManagedBy = function(user) {
  // Admin can manage all meetings
  if (user.role === "admin") {
    return true;
  }
  
  // HR can manage all meetings
  if (user.role === "hr") {
    return true;
  }
  
  // Project manager can manage meetings in their projects
  if (user.role === "project_manager") {
    return this.project.projectManager.toString() === user._id.toString();
  }
  
  // Organizer can manage their own meetings
  if (this.organizer.toString() === user._id.toString()) {
    return true;
  }
  
  return false;
};

// Method to add attendee
meetingSchema.methods.addAttendee = function(userId, status = "invited") {
  const existingAttendee = this.attendees.find(attendee => 
    attendee.user.toString() === userId.toString()
  );
  
  if (existingAttendee) {
    existingAttendee.status = status;
    return existingAttendee;
  }
  
  this.attendees.push({
    user: userId,
    status: status
  });
  
  return this.attendees[this.attendees.length - 1];
};

// Method to remove attendee
meetingSchema.methods.removeAttendee = function(userId) {
  const attendeeIndex = this.attendees.findIndex(attendee => 
    attendee.user.toString() === userId.toString()
  );
  
  if (attendeeIndex === -1) {
    return false;
  }
  
  this.attendees.splice(attendeeIndex, 1);
  return true;
};

// Method to update attendee status
meetingSchema.methods.updateAttendeeStatus = function(userId, status) {
  const attendee = this.attendees.find(attendee => 
    attendee.user.toString() === userId.toString()
  );
  
  if (!attendee) {
    return false;
  }
  
  attendee.status = status;
  return attendee;
};

// Method to start meeting
meetingSchema.methods.startMeeting = function() {
  this.status = "in_progress";
  return this;
};

// Method to end meeting
meetingSchema.methods.endMeeting = function() {
  this.status = "completed";
  return this;
};

// Method to cancel meeting
meetingSchema.methods.cancelMeeting = function() {
  this.status = "cancelled";
  return this;
};

export const Meeting = mongoose.model("Meeting", meetingSchema);

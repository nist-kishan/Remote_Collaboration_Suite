import mongoose from "mongoose";

const budgetRequestSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true
    },
    task: {
      name: {
        type: String,
        required: true,
        trim: true
      },
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task",
        required: false
      }
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    userName: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: "USD"
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, "Message cannot exceed 500 characters"]
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    reviewMessage: {
      type: String,
      trim: true
    },
    reviewedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Indexes
budgetRequestSchema.index({ project: 1, status: 1 });
budgetRequestSchema.index({ requestedBy: 1 });
budgetRequestSchema.index({ reviewedBy: 1 });

export const BudgetRequest = mongoose.model("BudgetRequest", budgetRequestSchema);


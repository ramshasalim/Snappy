import mongoose, { Schema } from "mongoose";

const challengeSchema = new Schema(
  {
    description: {
      type: String,
      required: true,
      trim: true,
    },

    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    generationSource: {
      type: String,
      enum: ["manual", "ai"],
      default: "manual",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const Challenge = mongoose.model("Challenge", challengeSchema);

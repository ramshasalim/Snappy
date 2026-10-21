import mongoose, { Schema } from "mongoose";

const roomSchema = new Schema(
  {
    roomCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    host: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    members: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    challengeMode: {
      type: String,
      enum: ["same", "different"],
      required: true,
    },

    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true,
    },

    status: {
      type: String,
      enum: ["waiting", "active", "completed"],
      default: "waiting",
    },

    maxPlayers: {
      type: Number,
      default: 4,
      min: 2,
    },

    timeLimit: {
      type: Number,
      enum: [1, 3, 5],
      required: true,
    },

    currentRound: {
      type: Number,
      default: 0,
      min: 0,
      max: 3,
    },

    maxRounds: {
      type: Number,
      default: 3,
      min: 1,
      max: 3,
    },
  },
  {
    timestamps: true,
  }
);

export const Room = mongoose.model("Room", roomSchema);

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Room } from "../models/room.model.js";

const createRoom = asyncHandler(async (req, res) => {
  const { hostId, challengeMode, difficulty, maxPlayers, timeLimit } = req.body;

  if (!hostId || !challengeMode || !difficulty) {
    throw new ApiError(400, "Required room details are missing");
  }

  if (!["same", "different"].includes(challengeMode)) {
    throw new ApiError(400, "Invalid challenge mode");
  }

  if (!["easy", "medium", "hard"].includes(difficulty)) {
    throw new ApiError(400, "Invalid difficulty");
  }
  if (![1, 3, 5].includes(Number(timeLimit))) {
    throw new ApiError(400, "Invalid time limit. Choose 1, 3, or 5 minutes.");
  }

  const roomCode = `SNAP${Math.random()
    .toString(36)
    .substring(2, 6)
    .toUpperCase()}`;

  const room = await Room.create({
    roomCode,
    host: hostId,
    members: [hostId],
    challengeMode,
    difficulty,
    maxPlayers: maxPlayers || 4,
    timeLimit: Number(timeLimit),
  });

  return res
    .status(201)
    .json(new ApiResponse(201, room, "Room created successfully"));
});
const joinRoom = asyncHandler(async (req, res) => {
  const { roomCode, userId } = req.body;

  if (!roomCode || !userId) {
    throw new ApiError(400, "Room code and user ID are required");
  }

  const room = await Room.findOne({
    roomCode: roomCode.toUpperCase().trim(),
  });

  if (!room) {
    throw new ApiError(404, "Room not found");
  }

  // If the player has already joined, return the room
  if (room.members.some((member) => member.toString() === userId)) {
    return res
      .status(200)
      .json(new ApiResponse(200, room, "You are already in this room"));
  }

  // Prevent joining after the game starts
  if (room.status !== "waiting") {
    throw new ApiError(400, "This room is no longer accepting players");
  }

  // Check whether the room is full
  if (room.members.length >= room.maxPlayers) {
    throw new ApiError(400, "This room is full");
  }

  room.members.push(userId);
  await room.save();

  return res
    .status(200)
    .json(new ApiResponse(200, room, "Joined room successfully"));
});
const startGame = asyncHandler(async (req, res) => {
  const { roomCode, userId } = req.body;

  if (!roomCode || !userId) {
    throw new ApiError(400, "Room code and user ID are required");
  }

  const room = await Room.findOne({
    roomCode: roomCode.toUpperCase().trim(),
  });

  if (!room) {
    throw new ApiError(404, "Room not found");
  }

  // Only the host can start the game
  if (room.host.toString() !== userId) {
    throw new ApiError(403, "Only the host can start the game");
  }

  // Prevent starting an already-started game
  if (room.status !== "waiting") {
    throw new ApiError(400, "The game has already started or finished");
  }

  room.status = "active";
  await room.save();

  return res
    .status(200)
    .json(new ApiResponse(200, room, "Game started successfully"));
});
export { createRoom, joinRoom, startGame };

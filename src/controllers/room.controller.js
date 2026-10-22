import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Room } from "../models/room.model.js";
import { Challenge } from "../models/challenges.model.js";

// 1. CREATE ROOM

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

// 2. JOIN ROOM

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

  // Prevent duplicate membership.

  if (room.members.some((member) => member.toString() === userId)) {
    return res
      .status(200)
      .json(new ApiResponse(200, room, "You are already in this room"));
  }

  // Prevent joining after the game starts.

  if (room.status !== "waiting") {
    throw new ApiError(400, "This room is no longer accepting players");
  }

  // Check whether the room is full.

  if (room.members.length >= room.maxPlayers) {
    throw new ApiError(400, "This room is full");
  }

  room.members.push(userId);

  await room.save();

  return res
    .status(200)
    .json(new ApiResponse(200, room, "Joined room successfully"));
});

//
// 3. CREATE CHALLENGE ASSIGNMENTS
//

const createRoundAssignments = async (room, roundNumber) => {
  // Find approved, active challenges matching the difficulty.

  const challenges = await Challenge.find({
    difficulty: room.difficulty,
    approvalStatus: "approved",
    isActive: true,
  });

  if (challenges.length === 0) {
    throw new ApiError(
      400,
      "No approved challenges available for this difficulty"
    );
  }

  // Different mode requires one unique challenge per player.

  if (
    room.challengeMode === "different" &&
    challenges.length < room.members.length
  ) {
    throw new ApiError(400, "Not enough unique challenges for all players");
  }

  // Shuffle the available challenges.

  const shuffledChallenges = [...challenges];

  for (let i = shuffledChallenges.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [shuffledChallenges[i], shuffledChallenges[j]] = [
      shuffledChallenges[j],
      shuffledChallenges[i],
    ];
  }

  // Assign challenges to players for this round.

  const challengeAssignments = room.members.map((player, index) => ({
    round: roundNumber,
    player,
    challenge:
      room.challengeMode === "same"
        ? shuffledChallenges[0]._id
        : shuffledChallenges[index]._id,
  }));

  return challengeAssignments;
};

//
// 4. END CURRENT ROUND AND START THE NEXT
//

const endRound = async (roomId) => {
  try {
    const room = await Room.findById(roomId);

    // Make sure the room and round are still active
    if (
      !room ||
      room.status !== "active" ||
      room.roundStatus !== "active" ||
      !room.roundEndsAt
    ) {
      return;
    }

    // Check the actual deadline
    const remainingTime = new Date(room.roundEndsAt).getTime() - Date.now();

    // If the deadline hasn't arrived, wait
    if (remainingTime > 0) {
      setTimeout(() => {
        endRound(roomId);
      }, remainingTime);

      return;
    }

    // End the current round
    room.roundStatus = "completed";

    // If this was the final round, finish the game
    if (room.currentRound >= room.maxRounds) {
      room.status = "completed";
    }

    await room.save();

    if (room.status === "completed") {
      console.log("The game has finished.");
    } else {
      console.log(
        `Round ${room.currentRound} has ended. Waiting for the host to start the next round.`
      );
    }
  } catch (error) {
    console.error("Failed to end round:", error);
  }
};

// Schedule the end of a round
const scheduleRoundEnd = (roomId, roundEndsAt) => {
  const delay = new Date(roundEndsAt).getTime() - Date.now();

  setTimeout(
    () => {
      endRound(roomId);
    },
    Math.max(delay, 0)
  );
};

//
// 6. START GAME
//

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

  // Only the host can start the game.

  if (room.host.toString() !== userId) {
    throw new ApiError(403, "Only the host can start the game");
  }

  // The room must be waiting.

  if (room.status !== "waiting") {
    throw new ApiError(400, "The game has already started or finished");
  }

  // Make sure the room has players.

  if (!room.members || room.members.length === 0) {
    throw new ApiError(400, "No players found in this room");
  }

  // Generate challenge assignments for Round 1.

  const challengeAssignments = await createRoundAssignments(room, 1);

  // Start Round 1.

  const now = new Date();

  room.challengeAssignments = challengeAssignments;
  room.currentRound = 1;
  room.status = "active";
  room.roundStartedAt = now;

  room.roundEndsAt = new Date(now.getTime() + room.timeLimit * 60 * 1000);

  room.roundStatus = "active";

  await room.save();

  // Schedule the end of Round 1.

  scheduleRoundEnd(room._id, room.roundEndsAt);

  // Populate challenge details for the response.

  await room.populate("challengeAssignments.challenge");

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        room,
        assignments: room.challengeAssignments,
      },
      "Game started and challenges assigned successfully"
    )
  );
});

const startNextRound = asyncHandler(async (req, res) => {
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

  // Only the host can start the next round
  if (room.host.toString() !== userId) {
    throw new ApiError(403, "Only the host can start the next round");
  }

  // The game must still be active
  if (room.status !== "active") {
    throw new ApiError(400, "The game is not active");
  }

  // The previous round must have ended
  if (room.roundStatus !== "completed") {
    throw new ApiError(400, "The current round has not finished");
  }

  // Check whether any rounds remain
  if (room.currentRound >= room.maxRounds) {
    throw new ApiError(400, "All rounds have been completed");
  }

  // Prepare challenges for the next round
  const nextRound = room.currentRound + 1;

  const newAssignments = await createRoundAssignments(room, nextRound);

  // Add assignments without removing previous rounds
  room.challengeAssignments.push(...newAssignments);

  // Start the next round
  const now = new Date();

  room.currentRound = nextRound;
  room.roundStartedAt = now;
  room.roundEndsAt = new Date(now.getTime() + room.timeLimit * 60 * 1000);
  room.roundStatus = "active";

  await room.save();

  // Schedule the round timer
  scheduleRoundEnd(room._id, room.roundEndsAt);

  // Return the updated room and challenges
  await room.populate("challengeAssignments.challenge");

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        room,
        assignments: room.challengeAssignments.filter(
          (assignment) => assignment.round === nextRound
        ),
      },
      `Round ${nextRound} started successfully`
    )
  );
});

//
// 7. EXPORT CONTROLLERS
//

export { createRoom, joinRoom, startGame, startNextRound };

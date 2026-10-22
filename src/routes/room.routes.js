import { Router } from "express";
import {
  createRoom,
  joinRoom,
  startGame,
  startNextRound,
} from "../controllers/room.controller.js";

const router = Router();

router.route("/create").post(createRoom);
router.route("/join").post(joinRoom);
router.route("/start").post(startGame);
router.route("/next-round").post(startNextRound);

export default router;

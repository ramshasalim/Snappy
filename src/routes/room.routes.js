import { Router } from "express";
import {
  createRoom,
  joinRoom,
  startGame,
} from "../controllers/room.controller.js";

const router = Router();

router.route("/create").post(createRoom);
router.route("/join").post(joinRoom);
router.route("/start").post(startGame);
export default router;

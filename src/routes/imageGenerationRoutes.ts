import express from "express";
import {
  createImage
} from "../controllers/imageGenerationController";

const router = express.Router();
router.post("/", createImage);

export default router;

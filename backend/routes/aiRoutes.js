import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { chatWithMentor } from "../controllers/aiController.js";

export const aiRouter = express.Router();

// All AI routes require authentication so we can inject user context
aiRouter.use(authMiddleware);

// POST /api/ai/chat
aiRouter.post("/chat", chatWithMentor);

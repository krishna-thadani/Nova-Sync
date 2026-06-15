import express from "express";
import { getDashboardData, repayDebt } from "../controllers/debtController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get dashboard data
router.get("/dashboard", getDashboardData);

// Repay debt manually
router.post("/repay", repayDebt);

export { router as debtRouter };

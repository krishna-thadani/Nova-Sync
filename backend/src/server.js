import express from "express";
import dotenv from "dotenv";
import path from "path";
import cookieParser from "cookie-parser";
import cors from "cors";
import connectDB from "../config/db.js";
import { authRouter } from "../routes/authRoutes.js";
import { taskRouter } from "../routes/taskRoutes.js";
import { routineRouter } from "../routes/routineRoutes.js";
import { analyticsRouter } from "../routes/analyticsRoutes.js";
import { debtRouter } from "../routes/debtRoutes.js";
import { aiRouter } from "../routes/aiRoutes.js";

// dotenv config
dotenv.config({ path: path.resolve(import.meta.dirname, "../.env") });
const PORT = process.env.PORT;

// Initialize express     
const app = express();


app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // Allow localhost and any Vercel deployment
      if (
        origin === "http://localhost:5173" || 
        origin === "http://127.0.0.1:5173" ||
        origin.endsWith(".vercel.app")
      ) {
        return callback(null, true);
      }
      
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
// Connect to MongoDB using mongoose
connectDB();

// Middleware for parsing cookies and request body
app.use(cookieParser());
app.use(express.json());

// Router for accessing auth routes
app.use("/api/auth", authRouter);

// Router for accessing task routes
app.use("/api/tasks", taskRouter);

// Router for accessing routine routes
app.use("/api/routines", routineRouter);

// Router for accessing analytics routes
app.use("/api/analytics", analyticsRouter);

// Router for accessing debt routes
app.use("/api/debt", debtRouter);

// Router for accessing ai routes
app.use("/api/ai", aiRouter);

app.get("/", (req, res) => {
  res.send("Server running");
});

// Start server on port (in .env file)
app.listen(PORT, () => {
  console.log(`Server running at port ${PORT}\nhttp://localhost:${PORT}/`);
});

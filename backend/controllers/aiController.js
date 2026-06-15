import { GoogleGenerativeAI } from "@google/generative-ai";
import Task from "../src/models/Task.js";
import Routine from "../src/models/Routine.js";
import User from "../src/models/User.js";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export const chatWithMentor = async (req, res) => {
  try {
    const { message, history } = req.body;
    const userId = req.userId;

    if (!message) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ success: false, message: "AI Assistant is not configured on the server." });
    }

    // 1. Fetch Context
    const user = await User.findById(userId).select("name");
    const tasks = await Task.find({ user: userId, status: { $in: ["Due", "In Progress"] } }).select("title description priority dueDate tags");
    const routines = await Routine.find({ user: userId }).select("name items");

    // Format Context
    const taskContext = tasks.length > 0 
      ? tasks.map(t => `- [${t.priority}] ${t.title} (Due: ${t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'None'})`).join("\n")
      : "No pending tasks.";
      
    const routineContext = routines.length > 0
      ? routines.map(r => `- ${r.name} (${r.items.length} habits/items)`).join("\n")
      : "No active routines.";

    const systemPrompt = `You are the "NovaSync Mentor", an elite, highly-motivating, and deeply knowledgeable AI assistant specifically designed for a student user named ${user?.name || "Student"}.
Your goal is to act as an all-rounder mentor: motivating them, helping them understand their study topics, and holding them accountable.

Here is the user's current context from their NovaSync dashboard:
PENDING TASKS:
${taskContext}

ROUTINES & HABITS:
${routineContext}

RULES:
1. Always be encouraging, inspiring, and direct.
2. If the user asks about what to study, look at their Pending Tasks and suggest the highest priority items.
3. If the user asks for help understanding a topic, assume the topic is related to their tasks and explain it clearly and concisely, like a great tutor.
4. Keep your responses formatted in Markdown (use bolding, bullet points, etc., to make it readable).
5. Do not hallucinate tasks they don't have.
6. Keep your answers relatively concise unless they explicitly ask for a long explanation.`;

    // 2. Format History for Gemini
    // Gemini expects history in the format: { role: "user" | "model", parts: [{ text: "..." }] }
    const formattedHistory = (history || []).map(msg => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }]
    }));

    // 3. Start Chat Session
    const chatSession = model.startChat({
      history: [
        { role: "user", parts: [{ text: "SYSTEM PROMPT (Internal instructions): " + systemPrompt }] },
        { role: "model", parts: [{ text: "Understood. I am the NovaSync Mentor. I have reviewed the user's tasks and routines. I will follow the rules and await the user's first message." }] },
        ...formattedHistory
      ],
      generationConfig: {
        maxOutputTokens: 800,
        temperature: 0.7,
      }
    });

    // 4. Send User Message
    const result = await chatSession.sendMessage(message);
    const responseText = result.response.text();

    return res.status(200).json({
      success: true,
      response: responseText
    });

  } catch (error) {
    console.error("AI Chat Error:", error);
    return res.status(500).json({ success: false, message: "Failed to communicate with AI Assistant." });
  }
};

import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const handleLLMChatQuery = async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ success: false, message: "Query is required" });
    }

    // Use Gemini 1.5 model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(query);
    const reply = result.response.text();

    res.status(200).json({
      success: true,
      reply,
    });
  } catch (error) {
    console.error("LLM Chatbot Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error processing chatbot query",
    });
  }
};

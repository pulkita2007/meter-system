const express = require("express");
const { body } = require("express-validator");
const { handleLLMChatQuery } = require("../controllers/llmChatbotController");
const auth = require("../middleware/auth");

const router = express.Router();

// @route   POST /api/chatbot/query
// @desc    Handle chatbot query (via Gemini AI)
// @access  Private
router.post(
  "/query",
  auth,
  [
    body("query")
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage("Query must be between 1 and 500 characters"),
  ],
  handleLLMChatQuery
);

module.exports = router;

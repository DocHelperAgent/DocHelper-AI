import express from 'express';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const GROQ_API_KEY = "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";

app.use(cors());
app.use(express.json());

app.post("/api/suggest", async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: "No text provided" });
    }

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "mixtral-8x7b-32768",
        messages: [
          {
            role: "system",
            content: "You are a professional document editor. Your task is to improve documents by enhancing clarity, professionalism, and structure while maintaining the original intent."
          },
          {
            role: "user",
            content: text
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.data.choices || !response.data.choices[0]?.message?.content) {
      throw new Error("Invalid response from Groq API");
    }

    res.json({ suggestion: response.data.choices[0].message.content.trim() });
  } catch (error) {
    console.error("Error fetching AI suggestion:", error.response?.data || error.message);
    res.status(500).json({ 
      error: "Failed to get AI suggestion",
      details: error.response?.data?.error || error.message 
    });
  }
});
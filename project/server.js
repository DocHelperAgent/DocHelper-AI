import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Groq } from 'groq-sdk';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const port = 3003;

// Initialize Groq client with better error handling and retry logic
let groq;
let initializationAttempts = 0;
const MAX_INITIALIZATION_ATTEMPTS = 3;

const initializeGroq = () => {
  try {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is not set in environment variables');
    }
    groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
      timeout: 30000 // 30 second timeout
    });
    console.log('Groq AI service initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize Groq:', error.message);
    return false;
  }
};

const initializeGroqWithRetry = async () => {
  while (initializationAttempts < MAX_INITIALIZATION_ATTEMPTS && !groq) {
    if (await initializeGroq()) {
      break;
    }
    initializationAttempts++;
    await new Promise(resolve => setTimeout(resolve, 1000 * initializationAttempts));
  }
};

initializeGroqWithRetry();

// Enhanced CORS configuration
const corsOptions = {
  origin: ['http://localhost:5174', 'http://127.0.0.1:5174'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, 'dist')));
}

// Health check endpoint with detailed status
app.get("/health", (req, res) => {
  const status = {
    server: "healthy",
    aiService: groq ? "available" : "unavailable",
    aiError: !groq ? `AI service not initialized after ${initializationAttempts} attempts` : null,
    timestamp: new Date().toISOString()
  };
  
  res.json(status);
});

// Improved AI suggestion endpoint with better error handling and retry logic
app.post("/api/suggest", async (req, res) => {
  if (!groq) {
    // Attempt to reinitialize if not available
    await initializeGroqWithRetry();
    if (!groq) {
      return res.status(503).json({
        error: "AI service unavailable",
        message: "The AI service is not properly initialized. Please try again later."
      });
    }
  }

  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        error: "Missing text",
        message: "Please provide text to get suggestions"
      });
    }

    if (text.length > 32000) {
      return res.status(400).json({
        error: "Text too long",
        message: "The provided text exceeds the maximum length limit"
      });
    }

    const prompt = `You are DocHelper AI, a professional document assistant. Please help improve the following text while maintaining its core meaning and professional tone. Focus on clarity, conciseness, and proper formatting. If the text appears to be a specific document type (e.g., resume, contract, letter), apply appropriate formatting and style conventions for that type:\n\n${text}`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are DocHelper AI, a professional document assistant focused on improving text while maintaining meaning and tone. You excel at identifying document types and applying appropriate formatting and style conventions."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "mixtral-8x7b-32768",
      temperature: 0.7,
      max_tokens: 32768,
      top_p: 1,
      stream: false
    });

    const suggestion = completion.choices[0]?.message?.content;

    if (!suggestion) {
      throw new Error('No suggestion generated');
    }

    res.json({ suggestion });
  } catch (error) {
    console.error("Error generating suggestion:", error);
    
    // Determine if error is retryable
    const isRetryableError = error.message?.includes('timeout') || 
                            error.message?.includes('rate limit') ||
                            error.message?.includes('connection');
    
    res.status(isRetryableError ? 503 : 500).json({
      error: "AI service error",
      message: error.message || "Failed to generate suggestion",
      retryable: isRetryableError
    });
  }
});

// Improved format document endpoint with better error handling
app.post("/api/format", async (req, res) => {
  if (!groq) {
    await initializeGroqWithRetry();
    if (!groq) {
      return res.status(503).json({
        error: "AI service unavailable",
        message: "The AI service is not properly initialized. Please try again later."
      });
    }
  }

  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        error: "Missing text",
        message: "Please provide text to format"
      });
    }

    if (text.length > 32000) {
      return res.status(400).json({
        error: "Text too long",
        message: "The provided text exceeds the maximum length limit"
      });
    }

    const prompt = `You are DocHelper AI, a professional document formatter. Please format the following text to improve its structure and readability. Apply the following formatting guidelines:

1. Use appropriate headings and subheadings
2. Organize content into logical paragraphs
3. Use bullet points or numbered lists where appropriate
4. Add proper spacing between sections
5. Maintain consistent formatting throughout
6. If the text is a specific document type (e.g., resume, contract), apply standard formatting conventions

Text to format:\n\n${text}`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are DocHelper AI, a professional document formatter focused on improving document structure, readability, and applying appropriate formatting conventions based on document type."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "mixtral-8x7b-32768",
      temperature: 0.5,
      max_tokens: 32768,
      top_p: 1,
      stream: false
    });

    const formattedText = completion.choices[0]?.message?.content;

    if (!formattedText) {
      throw new Error('No formatted text generated');
    }

    res.json({ formattedText });
  } catch (error) {
    console.error("Error formatting text:", error);
    
    const isRetryableError = error.message?.includes('timeout') || 
                            error.message?.includes('rate limit') ||
                            error.message?.includes('connection');
    
    res.status(isRetryableError ? 503 : 500).json({
      error: "AI service error",
      message: error.message || "Failed to format text",
      retryable: isRetryableError
    });
  }
});

// Root route handler
app.get('/', (req, res) => {
  res.redirect('http://localhost:5174');
});

// Handle React Router routes in production
app.get('*', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    res.sendFile(join(__dirname, 'dist', 'index.html'));
  } else {
    res.redirect('http://localhost:5174');
  }
});

// Start the server with improved error handling
try {
  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`AI Service: ${groq ? 'Available' : 'Unavailable'}`);
    if (!groq) {
      console.log('Warning: AI service not initialized. Check your GROQ_API_KEY.');
    }
  });

  // Handle server errors
  server.on('error', (error) => {
    console.error('Server error:', error);
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use. Please choose a different port.`);
    }
    process.exit(1);
  });

  // Handle process termination
  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
}
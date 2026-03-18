const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;
const GEMINI_KEY = process.env.GOOGLE_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_KEY}`;

console.log('Gemini API Key loaded:', GEMINI_KEY ? 'YES (' + GEMINI_KEY.substring(0, 10) + '...)' : 'NO');

const GEMINI_MODELS = [
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.5-flash'
];

app.post('/api/analyze', async (req, res) => {
  try {
    const { messages, tools } = req.body;
    const userMessage = messages.map(m => m.content).join('\n');

    console.log('Making Gemini API request...');

    const requestBody = {
      contents: [{ parts: [{ text: userMessage }] }],
      generationConfig: { maxOutputTokens: 2000, temperature: 0.7 }
    };

    if (tools && tools.length > 0) {
      requestBody.tools = [{ googleSearch: {} }];
    }

    let data = null;
    let lastError = '';

    // Try each model until one works
    for (const model of GEMINI_MODELS) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`;
      console.log(`  Trying model: ${model}`);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      data = await response.json();
      console.log(`  ${model} status: ${response.status}`);

      if (data.candidates && data.candidates[0]) {
        console.log(`  Success with: ${model}`);
        break;
      }
      
      lastError = data.error?.message || 'Unknown error';
      console.log(`  Failed: ${lastError}`);
      data = null;
    }

    let text = '';
    if (data && data.candidates && data.candidates[0]) {
      const parts = data.candidates[0].content?.parts || [];
      text = parts.map(p => p.text || '').join('\n');
    } else {
      text = `All models busy. Please try again in a moment. (${lastError})`;
    }

    res.json({ content: [{ type: 'text', text: text }] });

  } catch (error) {
    console.error('Server Error:', error.message);
    res.status(500).json({
      content: [{ type: 'text', text: `Server error: ${error.message}` }]
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Using: Google Gemini API (free tier)');
});
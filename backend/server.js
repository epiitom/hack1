// server.js

// Required packages
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const userRoutes = require('./routes/userRoutes');
const path = require('path');

// Initialize Express app
const app = express();

// Database configuration
const DB_PATH = process.env.NODE_ENV === 'production' 
  ? process.env.DATABASE_URL || './campus.db'
  : './campus.db';

// Configure CORS to allow requests from the React frontend
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL || 'https://your-frontend-domain.com']
    : ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174', 'http://localhost:3000'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());
app.use('/api/users', userRoutes);

// Initialize Google Generative AI (Gemini)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY.trim());

// Test the Gemini API connection at startup
async function testGeminiConnection() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Hello");
    console.log("Gemini API connection test successful");
  } catch (error) {
    console.error("Gemini API connection test failed:", error);
  }
}

testGeminiConnection();

// Connect to SQLite database
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) return console.error('Error connecting to database:', err.message);
  console.log(`Connected to the campus database at ${DB_PATH}`);

  initializeDatabase();
});

// Database Initialization Function
function initializeDatabase() {
  db.serialize(() => {
    // Create locations table
    db.run(`
      CREATE TABLE IF NOT EXISTS locations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        direction TEXT NOT NULL
      )
    `, (err) => {
      if (err) return console.error('Error creating locations table:', err.message);
      seedLocations();
    });

    // Create college table
    db.run(`
      CREATE TABLE IF NOT EXISTS college (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        lat REAL NOT NULL,
        lng REAL NOT NULL
      )
    `, (err) => {
      if (err) return console.error('Error creating college table:', err.message);
      seedCollege();
    });
  });
}

// Seed initial location data
function seedLocations() {
  const campusLocations = [
    { id: "block-b", name: "Block B", lat: 21.004756247708194, lng: 79.04765478207408, direction: "central" },
    { id: "workshop", name: "Workshop", lat: 21.005351796207126, lng: 79.0481970314045, direction: "eastern" },
    { id: "ground", name: "Ground", lat: 21.006691771676746, lng: 79.04887962765034, direction: "northeastern" },
    { id: "boys-hostel", name: "Boys Hostel", lat: 21.007728011092887, lng: 79.04926877128744, direction: "northern" },
    { id: "girls-hostel", name: "Girls Hostel", lat: 21.00787689547517, lng: 79.04815237560719, direction: "northwestern" },
    { id: "block-a", name: "Block A", lat: 21.00561433171004, lng: 79.04747320303898, direction: "western" },
    { id: "cafeteria", name: "Cafeteria", lat: 21.005862705999306, lng: 79.0481734648252, direction: "central" },
    { id: "atm", name: "ATM", lat: 21.006186029415307, lng: 79.04681526123541, direction: "western" },
    { id:"chatrapatti chowk", name : "chatrapatti chowk", lat:21.1112, lng:79.0688, direction : "northeast" }
  ];

  db.run('DELETE FROM locations', [], (err) => {
    if (err) return console.error('Error clearing locations table:', err.message);
    const insertStatement = db.prepare('INSERT INTO locations (id, name, lat, lng, direction) VALUES (?, ?, ?, ?, ?)');
    campusLocations.forEach(location => {
      insertStatement.run(location.id, location.name, location.lat, location.lng, location.direction);
    });
    insertStatement.finalize(() => console.log('Locations data inserted successfully'));
  });
}

// Seed initial college data
function seedCollege() {
  db.run(`INSERT OR REPLACE INTO college (id, name, lat, lng) 
          VALUES (1, 'St. Vincent Pallotti College of Engineering and Technology', 21.0047, 79.0476)`,
    (err) => {
      if (err) return console.error('Error inserting college data:', err.message);
      console.log('College data inserted successfully');
    });
}

// Helper to check if query is asking for a location
function isAskingForLocation(query) {
  const locationKeywords = ["where", "find", "located", "location", "direction", "how to get", "where is"];
  return locationKeywords.some(keyword => query.toLowerCase().includes(keyword));
}

// Helper to match location from query
function findLocationInQuery(query, locationNames) {
  query = query.toLowerCase();
  return locationNames.find(location =>
    query.includes(location.id.toLowerCase()) || query.includes(location.name.toLowerCase())
  );
}

// POST: /api/campus-guide
app.post('/api/campus-guide', async (req, res) => {
  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ message: "Query is required" });
  }

  // Get all location names for matching
  db.all('SELECT * FROM locations', [], async (err, locations) => {
    if (err) {
      console.error('Error fetching locations:', err.message);
      return res.status(500).json({ error: err.message });
    }

    const locationNames = locations.map(loc => loc.name.toLowerCase());
    const isLocationQuery = isAskingForLocation(query);
    const matchedLocation = findLocationInQuery(query.toLowerCase(), locations);

    if (matchedLocation) {
      try {
        console.log("Attempting to generate response with Gemini API...");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `You are a witty and fun campus guide AI. Generate a creative, humorous, and engaging response (max 2 sentences) for a student asking about the ${matchedLocation.name} at St. Vincent Pallotti College.
        Include these facts in a fun way:
        - It's located in the ${matchedLocation.direction} part of campus
        - Make a joke or pun related to the location's purpose
        - Add relevant emojis
        - Keep it friendly and playful
        
        For example, if it's the canteen, joke about food or hunger. If it's the library, joke about studying or books.`;

        const result = await model.generateContent(prompt);
        const aiResponse = result.response.text();
        console.log("Gemini API response:", aiResponse);
        
        return res.json({
          location: matchedLocation,
          message: aiResponse,
          showMap: true
        });
      } catch (error) {
        console.error("Error with Gemini API:", error);
        console.log("Falling back to pre-written responses");
        // Fallback to pre-written witty responses if API fails
        const wittyResponses = {
          "block-b": [
            `Welcome to Block B in the ${matchedLocation.direction} area! Where engineering dreams come to life, and occasionally where students come to question their life choices! 🏛️`,
            `Block B, standing proudly in the ${matchedLocation.direction} part of campus - where future innovators gather (and sometimes nap between classes)! 🎓`
          ],
          "workshop": [
            `The Workshop in the ${matchedLocation.direction} zone is where ideas transform into reality! Just remember: safety goggles are your best fashion accessory! 🛠️`,
            `Head to the ${matchedLocation.direction} area to find our Workshop - where we turn coffee into engineering marvels! ⚡`
          ],
          "ground": [
            `The Ground awaits in the ${matchedLocation.direction} part of campus - where engineers prove they can run as fast as their code compiles! 🏃‍♂️`,
            `Need a break from debugging? Our spacious Ground in the ${matchedLocation.direction} area is perfect for both sports and dramatic "why won't my code work" moments! ⚽`
          ],
          "boys-hostel": [
            `The Boys Hostel stands in the ${matchedLocation.direction} zone - where future engineers master the art of cooking Maggi and doing laundry! 🏠`,
            `Head ${matchedLocation.direction} to find the Boys Hostel - where sleep schedules are as theoretical as quantum physics! 😴`
          ],
          "girls-hostel": [
            `The Girls Hostel in the ${matchedLocation.direction} area - where future tech leaders perfect both coding and corridor conversations! 🏢`,
            `Located in the ${matchedLocation.direction} part, the Girls Hostel is where brilliant minds meet midnight snacks! 🌙`
          ],
          "block-a": [
            `Block A holds court in the ${matchedLocation.direction} zone - where classroom adventures and engineering mysteries unfold! 🏛️`,
            `Make your way to the ${matchedLocation.direction} side to find Block A - where every day is a new episode of "How I Met My Deadline"! 📚`
          ],
          "cafeteria": [
            `Hungry? The Cafeteria in the ${matchedLocation.direction} area is your sanctuary of snacks and socializing! Where great minds eat alike! 🍽️`,
            `Follow the aroma to our ${matchedLocation.direction} Cafeteria - where coffee and coding conversations create the perfect blend! ☕`
          ],
          "atm": [
            `Need cash? The ATM stands ready in the ${matchedLocation.direction} part of campus - where your wallet goes to get CPR! 💳`,
            `Head ${matchedLocation.direction} to find our ATM - the most popular spot right before mess fee deadlines! 💰`
          ]
        };

        const responses = wittyResponses[matchedLocation.id] || [`The ${matchedLocation.name} is located in the ${matchedLocation.direction} part of the campus. Let me show you the way! 🎯`];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];

        return res.json({
          location: matchedLocation,
          message: randomResponse,
          showMap: true
        });
      }
    } else {
      try {
        // Handle general conversation
        console.log("Attempting to generate general conversation response with Gemini API...");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `You are a friendly and witty campus guide AI assistant for St. Vincent Pallotti College. 
        The student asked: "${query}"
        
        Respond in a fun, engaging way:
        - Keep your response concise (max 2-3 sentences)
        - Use emojis where appropriate
        - Be helpful and friendly
        - If they're asking about campus life, studies, or general college information, provide relevant advice
        - If they're just chatting, be conversational and engaging
        - If you're not sure about something, be honest and suggest they ask a faculty member
        
        Remember: You're a helpful campus guide, so keep responses relevant to college life!`;

        const result = await model.generateContent(prompt);
        const aiResponse = result.response.text();
        console.log("Gemini API response:", aiResponse);
        
        return res.json({
          message: aiResponse,
          showMap: false
        });
      } catch (error) {
        console.error("Error with Gemini API:", error);
        // Fallback responses for general conversation
        const fallbackResponses = [
          "I'm here to help you with anything about campus life! Feel free to ask about locations, studies, or just chat! 😊",
          "That's an interesting question! I'm your campus guide, so I can help you with directions, campus life, or just have a friendly chat! 🎓",
          "I'm always happy to help! Whether you need directions, want to know about campus life, or just want to chat, I'm here for you! 🌟"
        ];
        const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
        return res.json({
          message: randomResponse,
          showMap: false
        });
      }
    }
  });
});

// GET: /api/locations
app.get('/api/locations', (req, res) => {
  console.log('GET request to /api/locations');
  db.all('SELECT * FROM locations', [], (err, rows) => {
    if (err) {
      console.error('Error fetching locations:', err.message);
      return res.status(500).json({ error: err.message });
    }
    console.log(`Returning ${rows.length} locations`);
    res.json(rows);
  });
});

// GET: /api/college
app.get('/api/college', (req, res) => {
  console.log('GET request to /api/college');
  db.get('SELECT * FROM college WHERE id = 1', [], (err, row) => {
    if (err) {
      console.error('Error fetching college data:', err.message);
      return res.status(500).json({ error: err.message });
    }
    console.log('Returning college data');
    res.json(row);
  });
});

// Test endpoint to check locations
app.get('/api/test-locations', (req, res) => {
  db.all('SELECT * FROM locations', [], (err, rows) => {
    if (err) {
      console.error('Error fetching locations:', err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json({ 
      message: 'Locations found in database',
      locations: rows,
      count: rows.length
    });
  });
});

// Test endpoint to check Gemini API
app.get('/api/test-gemini', async (req, res) => {
  try {
    console.log("Testing Gemini API...");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = "Explain how AI works in one short, fun sentence";
    console.log("Sending prompt:", prompt);
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    console.log("Gemini API response:", response);
    res.json({ 
      message: 'Gemini API test successful',
      response: response,
      apiKey: process.env.GEMINI_API_KEY ? "API key is present" : "API key is missing"
    });
  } catch (error) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ 
      error: 'Gemini API test failed',
      details: error.message,
      apiKey: process.env.GEMINI_API_KEY ? "API key is present" : "API key is missing"
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  console.log('Health check request received');
  res.json({ status: 'ok', message: 'Server is running' });
});

// Root route to verify the server is working
app.get('/', (req, res) => {
  res.send('Campus Guide API Server is running. Use /api/health to check status.');
});

// Serve static files from the React frontend app
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Handle any requests that don't match the above
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/api/health`);
  console.log(`API endpoints available at:`);
  console.log(`- http://localhost:${PORT}/api/locations`);
  console.log(`- http://localhost:${PORT}/api/college`);
  console.log(`- http://localhost:${PORT}/api/campus-guide (POST)`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close(() => {
    console.log('Database connection closed');
    process.exit(0);
  });
});
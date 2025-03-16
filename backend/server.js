// server.js

// Required packages
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

// Initialize Express app
const app = express();

// Configure CORS to allow requests from the React frontend
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174', 'http://localhost:3000'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());

// Initialize Google Generative AI (Gemini)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || ''); // Fallback to empty string if not found

// Connect to SQLite database
const db = new sqlite3.Database('./campus.db', (err) => {
  if (err) return console.error('Error connecting to database:', err.message);
  console.log('Connected to the campus database.');

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
    { id: "canteen", name: "Canteen", lat: 21.0052, lng: 79.0480, direction: "northern" },
    { id: "library", name: "Library", lat: 21.0045, lng: 79.0482, direction: "eastern" },
    { id: "auditorium", name: "Auditorium", lat: 21.0040, lng: 79.0478, direction: "southern" },
    { id: "sports-complex", name: "Sports Complex", lat: 21.0055, lng: 79.0470, direction: "northwestern" },
    { id: "admin-block", name: "Admin Block", lat: 21.0048, lng: 79.0473, direction: "central" }
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
        const geminiModel = genAI.getGenerativeModel({ model: "gemini-pro" });
        const prompt = `You are a witty and fun campus guide AI. Generate a creative, humorous, and engaging response (max 2 sentences) for a student asking about the ${matchedLocation.name} at St. Vincent Pallotti College.
        Include these facts in a fun way:
        - It's located in the ${matchedLocation.direction} part of campus
        - Make a joke or pun related to the location's purpose
        - Add relevant emojis
        - Keep it friendly and playful
        
        For example, if it's the canteen, joke about food or hunger. If it's the library, joke about studying or books.`;

        const result = await geminiModel.generateContent(prompt);
        const aiResponse = result.response.text();
        
        return res.json({
          location: matchedLocation,
          message: aiResponse,
          showMap: true
        });
      } catch (error) {
        console.error("Error with Gemini API:", error);
        // Fallback to pre-written witty responses if API fails
        const wittyResponses = {
          canteen: [
            `Hungry? The ${matchedLocation.name} is your oasis in the ${matchedLocation.direction} part of campus! Follow your nose (and our map) to find the best campus food. 🍽️`,
            `Ah, the ${matchedLocation.name}! Located in the ${matchedLocation.direction} area, it's where great minds go to refuel. Just don't blame us if you spend your entire scholarship on samosas! 🥘`
          ],
          library: [
            `The ${matchedLocation.name} awaits in the ${matchedLocation.direction} section - where silence is golden and knowledge is platinum! Don't forget to bring your reading glasses (and maybe a coffee). 📚`,
            `Looking for a quiet escape? The ${matchedLocation.name} in the ${matchedLocation.direction} zone is your sanctuary. Just remember: snoring while studying is frowned upon! 🤓`
          ],
          auditorium: [
            `Lights, camera, action! The ${matchedLocation.name} stands proudly in the ${matchedLocation.direction} area. It's where stars are born (or at least where they give presentations). 🎭`,
            `Head to the ${matchedLocation.direction} side to find our magnificent ${matchedLocation.name}. It's like Broadway, but with more engineering presentations! 🎬`
          ],
          "sports-complex": [
            `Game on! The ${matchedLocation.name} is pumping with energy in the ${matchedLocation.direction} zone. Where future engineers prove they're not just good with computers! 🏃‍♂️`,
            `Need to burn off those canteen samosas? The ${matchedLocation.name} in the ${matchedLocation.direction} area is your fitness paradise! 🏋️‍♀️`
          ],
          "admin-block": [
            `The ${matchedLocation.name} holds court in the ${matchedLocation.direction} part of campus. It's where all the magic (and paperwork) happens! ✨`,
            `Looking for the big bosses? They're in the ${matchedLocation.name}, ${matchedLocation.direction} area. Don't worry, they don't bite... usually! 😉`
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
    } else if (isLocationQuery) {
      return res.json({
        message: "I know this campus like the back of my hand! Try asking about the canteen (for those hunger emergencies), library (where dreams and deadlines meet), auditorium (our very own Broadway), sports complex (where future engineers turn into athletes), or admin block (the command center)!",
        showMap: false
      });
    } else if (/\bhello\b|\bhi\b|\bhey\b/i.test(query)) {
      return res.json({
        message: "Hey there, campus explorer! 👋 I'm your friendly neighborhood guide, ready to help you navigate through our awesome campus. Where would you like to go today?",
        showMap: false
      });
    } else {
      return res.json({
        message: "I'm your campus navigation buddy! Try asking me things like 'Where's the canteen?' or 'How do I get to the library?' I promise to keep you entertained while showing you around! 🎯",
        showMap: false
      });
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  console.log('Health check request received');
  res.json({ status: 'ok', message: 'Server is running' });
});

// Root route to verify the server is working
app.get('/', (req, res) => {
  res.send('Campus Guide API Server is running. Use /api/health to check status.');
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
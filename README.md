# Campus Navigator 🧭

A witty, interactive campus guide web application that helps students navigate your campus with style. Built with Express.js, React, SQL, and integrated with Leaflet and OpenStreetMap.

## 🔗 Live Demo

Check out the live demo of Campus Navigator: [https://campusguide1.onrender.com/](https://campusguide1.onrender.com/)

## 🎓 Project Overview

Campus Navigator is an interactive web application designed to help students find their way around campus. Users can:

- Search for campus locations by name, building code, or function
- Get personalized, witty directions to their destination
- View locations on an interactive map
- Save favorite places for quick access
- Contribute location information to improve the database

## 🚀 Features

- **Interactive Map**: Built with Leaflet.js and OpenStreetMap for smooth, responsive navigation
- **Location Database**: SQL-powered backend stores detailed information about campus locations
- **Natural Language Queries**: Ask questions like "Where's the library?" or "How do I get to the science building?"
- **Witty Responses**: Engaging, personalized directions with a touch of humor
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **User Authentication**: Save favorite locations and preferences

## 🔧 Tech Stack

- **Frontend**: React.js, Leaflet.js
- **Backend**: Express.js, Node.js
- **Database**: SQL (MySQL/PostgreSQL)
- **Maps**: OpenStreetMap integration
- **API**: RESTful API for location queries
- **Deployment**: Hosted on Render

## 📋 Installation

1. **Clone the repository**
   ```
   git clone https://github.com/epiitom/hack1
   cd campus-navigator
   ```

2. **Install dependencies**
   ```
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd frontend
   npm install
   ```

3. **Set up the database**
   ```
   # Create a .env file with your database credentials
   cp .env.example .env
   
   # Import the database schema
   npm run db:setup
   ```

4. **Start the development servers**
   ```
   # Start the backend server
   npm run server
   
   # In a new terminal, start the frontend
   cd frontend
   npm start
   ```

5. **Access the application**
   - Backend API: http://localhost:5000
   - Frontend: http://localhost:3000

## 🗃️ Database Structure

The application uses a SQL database with the following main tables:

- `locations` - Stores campus locations with coordinates, descriptions, and metadata
- `paths` - Contains path information between locations
- `witty_responses` - Collection of response templates for different location types
- `users` - User profiles and preferences (if authentication is implemented)

## 🌐 API Endpoints

- `GET /api/locations` - Get all locations
- `GET /api/locations/:id` - Get location by ID


## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔮 Future Enhancements

- Indoor navigation capabilities
- Event integration (show campus events near locations)
- Augmented reality walking directions
- Voice navigation
- Multi-language support
- User-contributed location reviews and tips

## 📸 Screenshots

![image](https://github.com/user-attachments/assets/d6f7e03a-3679-411b-acb1-109f0f2888bf)


## 🙏 Acknowledgements

- OpenStreetMap contributors
- Leaflet.js team
- All campus staff who helped provide accurate location data

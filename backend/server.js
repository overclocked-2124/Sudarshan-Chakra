const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const MONGODB_URI = "mongodb+srv://snehalreddy:S0OcbrCRXJmAZrAd@sudarshan-chakra-cluste.0hokvj0.mongodb.net/radarDB";

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Radar Data Schema
const radarDataSchema = new mongoose.Schema({
  angle: {
    type: Number,
    required: true,
    min: 0,
    max: 180
  },
  distance: {
    type: Number,
    required: true,
    min: 0
  },
  timestamp: {
    type: Number,
    required: true,
    default: () => Date.now() / 1000
  }
}, {
  timestamps: true
});

const RadarData = mongoose.model('RadarData', radarDataSchema, 'scans');

// Routes
// Get latest radar data
app.get('/api/radar/latest', async (req, res) => {
  try {
    const latestData = await RadarData.findOne().sort({ timestamp: -1 });
    
    if (!latestData) {
      return res.status(404).json({ message: 'No radar data found' });
    }
    
    res.json(latestData);
  } catch (error) {
    console.error('Error fetching latest radar data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all radar data with pagination
app.get('/api/radar/all', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const radarData = await RadarData.find()
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await RadarData.countDocuments();
    
    res.json({
      data: radarData,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching radar data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get last 5 radar data points for 3D visualization
app.get('/api/radar/recent', async (req, res) => {
  try {
    const recentData = await RadarData.find()
      .sort({ timestamp: -1 })
      .limit(5);
    
    if (!recentData || recentData.length === 0) {
      return res.status(404).json({ message: 'No radar data found' });
    }
    
    // Return in chronological order (oldest first) for visualization
    res.json(recentData.reverse());
  } catch (error) {
    console.error('Error fetching recent radar data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Latest radar data: http://localhost:${PORT}/api/radar/latest`);
});

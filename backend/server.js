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

console.log('🚀 Starting Sudarshan Chakra Radar Server...');
console.log('📡 Connecting to MongoDB Atlas...');

mongoose.connect(MONGODB_URI)
.then(() => {
  console.log('✅ Connected to MongoDB Atlas successfully');
  console.log('🎯 Database: radarDB');
  console.log('📊 Collection: scans');
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  console.log('⚠️  Retrying connection in 5 seconds...');
});

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
    console.log('🎯 [API] Fetching latest radar data...');
    const latestData = await RadarData.findOne().sort({ timestamp: -1 });
    
    if (!latestData) {
      console.log('⚠️  [API] No radar data found in database');
      return res.status(404).json({ message: 'No radar data found' });
    }
    
    console.log(`📊 [API] Latest data: Angle=${latestData.angle}°, Distance=${latestData.distance}cm, Time=${new Date(latestData.timestamp * 1000).toISOString()}`);
    res.json(latestData);
  } catch (error) {
    console.error('❌ [API] Error fetching latest radar data:', error);
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
    console.log('🎯 [API] Fetching recent radar data (last 5 points)...');
    const recentData = await RadarData.find()
      .sort({ timestamp: -1 })
      .limit(5);
    
    if (!recentData || recentData.length === 0) {
      console.log('⚠️  [API] No recent radar data found in database');
      return res.status(404).json({ message: 'No radar data found' });
    }
    
    console.log(`📊 [API] Found ${recentData.length} recent data points`);
    recentData.forEach((data, index) => {
      console.log(`   ${index + 1}. Angle=${data.angle}°, Distance=${data.distance}cm, Time=${new Date(data.timestamp * 1000).toISOString()}`);
    });
    
    // Return in chronological order (oldest first) for visualization
    res.json(recentData.reverse());
  } catch (error) {
    console.error('❌ [API] Error fetching recent radar data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
  console.log(`🏥 [HEALTH] System health check - Database: ${dbStatus}`);
  
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: dbStatus,
    server: 'Sudarshan Chakra Radar System',
    version: '1.0.0'
  });
});

app.listen(PORT, () => {
  console.log('');
  console.log('🚀 ===================================');
  console.log('🎯 SUDARSHAN CHAKRA RADAR SERVER');
  console.log('🚀 ===================================');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🎯 Latest radar data: http://localhost:${PORT}/api/radar/latest`);
  console.log(`📊 Recent radar data: http://localhost:${PORT}/api/radar/recent`);
  console.log('🚀 ===================================');
  console.log('⚡ Server ready for connections...');
  console.log('');
});

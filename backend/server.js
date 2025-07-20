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
const MONGODB_URI = "mongodb+srv://snehalreddy:S0OcbrCRXJmAZrAd@sudarshan-chakra-cluste.0hokvj0.mongodb.net/sudarshan-chakra";

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

const RadarData = mongoose.model('RadarData', radarDataSchema);

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

// Create new radar data (for testing)
app.post('/api/radar', async (req, res) => {
  try {
    const { angle, distance } = req.body;
    
    // Validate angle range (0-180 degrees)
    if (angle < 0 || angle > 180) {
      return res.status(400).json({ message: 'Angle must be between 0 and 180 degrees' });
    }
    
    // Validate distance
    if (distance < 0) {
      return res.status(400).json({ message: 'Distance must be non-negative' });
    }
    
    const radarData = new RadarData({
      angle,
      distance,
      timestamp: Date.now() / 1000
    });
    
    await radarData.save();
    res.status(201).json(radarData);
  } catch (error) {
    console.error('Error creating radar data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add some sample data if database is empty
app.post('/api/radar/seed', async (req, res) => {
  try {
    const count = await RadarData.countDocuments();
    
    if (count === 0) {
      const sampleData = [
        { angle: 30.9, distance: 80.1, timestamp: Date.now() / 1000 },
        { angle: 45.5, distance: 65.3, timestamp: (Date.now() / 1000) - 30 },
        { angle: 120.0, distance: 45.8, timestamp: (Date.now() / 1000) - 60 },
        { angle: 89.2, distance: 72.4, timestamp: (Date.now() / 1000) - 90 }
      ];
      
      await RadarData.insertMany(sampleData);
      res.json({ message: 'Sample data added successfully', count: sampleData.length });
    } else {
      res.json({ message: 'Database already contains data', count });
    }
  } catch (error) {
    console.error('Error seeding data:', error);
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

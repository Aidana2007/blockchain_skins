require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { verifyConnection } = require('./config/blockchain');
const { startListening } = require('./services/BlockchainListener');
const authRoutes = require('./routes/authRoutes');
const skinRoutes = require('./routes/skinRoutes');
const campaignRoutes = require('./routes/campaignRoutes');
const app = express();
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://192.168.56.1:3000'
].filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  console.log('Body:', req.body);
  console.log('Headers:', req.headers);
  next();
});
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString()
  });
});
app.use('/api/auth', authRoutes);
app.use('/api/skins', skinRoutes);
app.use('/api/campaigns', campaignRoutes);
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Blockchain Skins Marketplace API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      skins: '/api/skins',
      campaigns: '/api/campaigns',
      health: '/health'
    }
  });
});
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
async function startServer() {
  try {
    console.log('\n🚀 Starting Blockchain Skins Marketplace Server...\n');
    await connectDB();
    const blockchainConnected = await verifyConnection();
    if (!blockchainConnected) {
      console.warn('⚠️  Warning: Could not verify blockchain connection');
      console.warn('   Server will start, but blockchain features may not work');
    }
    if (blockchainConnected) {
      try {
        await startListening();
      } catch (error) {
        console.error('❌ Failed to start blockchain listener:', error.message);
        console.warn('   Server will continue without event listening');
      }
    }
    app.listen(PORT, () => {
      console.log('\n' + '='.repeat(60));
      console.log('✅ SERVER STARTED SUCCESSFULLY');
      console.log('='.repeat(60));
      console.log(`📡 Environment: ${NODE_ENV}`);
      console.log(`🌐 Port: ${PORT}`);
      console.log(`🔗 URL: http://localhost:${PORT}`);
      console.log(`📚 API: http://localhost:${PORT}/api`);
      console.log(`💚 Health: http://localhost:${PORT}/health`);
      console.log('='.repeat(60) + '\n');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}
process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});
process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT received. Shutting down gracefully...');
  process.exit(0);
});
process.on('uncaughtException', (err) => {
  console.error('❌ UNCAUGHT EXCEPTION!');
  console.error(err);
});
process.on('unhandledRejection', (err) => {
  console.error('❌ UNHANDLED REJECTION!');
  console.error(err);
});
startServer();
module.exports = app;
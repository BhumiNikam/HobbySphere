const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
// Remove apiLimiter from here - it will be applied per-route instead
// const { apiLimiter } = require('./middleware/rateLimiter');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Connect DB first
connectDB();

// Auto-create indexes after MongoDB connection
mongoose.connection.once('open', async () => {
  console.log('✅ MongoDB Connected');
  
  // ✅ AUTO-CREATE INDEXES
  try {
    await Promise.all([
      mongoose.model('Community').createIndexes(),
      mongoose.model('Post').createIndexes(),
      mongoose.model('User').createIndexes()
    ]);
    console.log('✅ Database indexes created successfully');
  } catch (error) {
    console.error('❌ Index creation error:', error);
  }
});

// Middleware - ORDER MATTERS!
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Security headers
app.use(helmet());

// REMOVE THIS LINE - Don't apply rate limiting globally
// app.use('/api/', apiLimiter);

// Socket.io
const userSockets = new Map();

io.on('connection', (socket) => {
  socket.on('register', (userId) => {
    userSockets.set(userId, socket.id);
  });

  socket.on('disconnect', () => {
    for (let [userId, socketId] of userSockets.entries()) {
      if (socketId === socket.id) {
        userSockets.delete(userId);
        break;
      }
    }
  });
});

// Make io and userSockets available to routes
app.set('io', io);
app.set('userSockets', userSockets);

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/communities', require('./routes/communityRoutes'));
app.use('/api/posts', require('./routes/postRoutes'));
app.use('/api/posts', require('./routes/commentRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/search', require('./routes/searchRoutes'));
app.use('/api', require('./routes/bookmarkRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
// app.use('/api/stories', require('./routes/storyRoutes')); // Story feature removed

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'HobbySphere API running' });
});

// Test email route
app.get("/test-email", async (req, res) => {
  const { sendPasswordResetEmail } = require("./services/emailService");

  try {
    await sendPasswordResetEmail(
      "aniketkasav07@gmail.com",
      "Aniket",
      "Hashed-07"
    );
    res.send("Email sent");
  } catch (err) {
    console.error(err);
    res.status(500).send("Email failed");
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  res.status(500).json({ message: err.message });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Server running on port ${PORT}`);
  }
});
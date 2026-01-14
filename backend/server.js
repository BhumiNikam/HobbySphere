const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
// Remove apiLimiter from here - it will be applied per-route instead
// const { apiLimiter } = require('./middleware/rateLimiter');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Connect DB first
connectDB();

// Middleware - ORDER MATTERS!
app.use(cors());

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Security headers
app.use(helmet());

// REMOVE THIS LINE - Don't apply rate limiting globally
// app.use('/api/', apiLimiter);

// Socket.io
const userSockets = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('register', (userId) => {
    userSockets.set(userId, socket.id);
    console.log(`User ${userId} registered with socket ${socket.id}`);
  });

  socket.on('disconnect', () => {
    for (let [userId, socketId] of userSockets.entries()) {
      if (socketId === socket.id) {
        userSockets.delete(userId);
        break;
      }
    }
    console.log('User disconnected:', socket.id);
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
app.use('/api/reels', require('./routes/reelRoutes'));
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

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  res.status(500).json({ message: err.message });
});

// 404 handler
app.use((req, res) => {
  console.log('404 - Route not found:', req.method, req.url);
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
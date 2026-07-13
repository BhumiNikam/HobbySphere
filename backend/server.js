const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

app.set('trust proxy', 1);

// CORS allowed origins
const allowedOrigins = [
  'http://localhost:5173',
  'https://hobby-community-app.vercel.app',
  'https://www.hobbysphere.in',
  'https://hobbysphere.in'
];

// Add environment variable origins if set
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

connectDB();

mongoose.connection.once('open', async () => {
  console.log('✅ MongoDB Connected');
  
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

app.use(compression());

app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

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

app.set('io', io);
app.set('userSockets', userSockets);

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/communities', require('./routes/communityRoutes'));
app.use('/api/posts', require('./routes/postRoutes'));
app.use('/api/posts', require('./routes/commentRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/search', require('./routes/searchRoutes'));
app.use('/api/bookmarks', require('./routes/bookmarkRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));

app.get('/', (req, res) => {
  res.json({ message: 'HobbySphere API running' });
});

app.get("/test-email", async (req, res) => {
  const { sendPasswordResetEmail } = require("./services/emailService");
  const toEmail = req.query.email || "aniketkasav07@gmail.com";

  try {
    await sendPasswordResetEmail(toEmail, "HobbySphere User", "test-token-123");
    res.send(`Email sent to ${toEmail}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Email failed");
  }
});

app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  res.status(500).json({ message: err.message });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Server running on port ${PORT}`);
  }
});
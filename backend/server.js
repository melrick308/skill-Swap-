const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const dotenv     = require('dotenv');
const http       = require('http');
const socketIo   = require('socket.io');
const path       = require('path');
const bcrypt = require('bcryptjs');
const User   = require('./models/User');
const bodyParser = require('body-parser');

// Import routes and controllers
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const matchRoutes = require('./routes/matchRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const { setSocketIO: setSessionSocketIO } = require('./controllers/sessionController');
const { setSocket: setNotificationSocketIO } = require('./controllers/notificationController');
const adminRoutes = require('./routes/adminRoutes');  // ← Admin dashboard routes
const reportRoutes = require('./routes/reportRoutes'); // Import reportRoutes

dotenv.config();

const app    = express();
const server = http.createServer(app);

// ✅ Create Socket.IO instance ONCE
const io     = socketIo(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type, x-auth-token'],
    credentials: true,
  },
});

// ✅ Create namespaces from single instance
const sessionSocket      = io.of('/sessions');
const notificationSocket = io.of('/notifications');

// Pass the socket instances to controllers
setSessionSocketIO(sessionSocket);
setNotificationSocketIO(notificationSocket);

// ─── MIDDLEWARE ───────────────────────────────────────────────────
// Use body parsing for both JSON and URL encoded data
app.use(express.json());  // For parsing application/json
app.use(express.urlencoded({ extended: true }));  // For parsing application/x-www-form-urlencoded
app.use(cors());

// Serve static files (images) from 'uploads' folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ← Add this to explicitly serve profile pictures:
app.use(
  '/uploads/profile-pictures',
  express.static(path.join(__dirname, 'uploads/profile-pictures'))
);

// Serve media files from 'message-uploads' folder
app.use('/uploads/message-uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');

    const {
      ADMIN_EMAIL,
      ADMIN_PASSWORD,
      ADMIN_NAME,
      ADMIN_PIC_URL
    } = process.env;

    let admin = await User.findOne({ email: ADMIN_EMAIL });
    if (!admin) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(ADMIN_PASSWORD, salt);
      admin = new User({
        name:           ADMIN_NAME || 'Administrator',
        email:          ADMIN_EMAIL,
        password:       hash,
        role:           'admin',
        profilePicture: ADMIN_PIC_URL ? path.basename(ADMIN_PIC_URL) : ''
      });
      await admin.save();
      console.log('🚀 Admin user seeded:', ADMIN_EMAIL);
    }
  })
  .catch(err => console.error('Error connecting to MongoDB:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);  // ← Mount Admin Dashboard routes
app.use('/api/reports', reportRoutes);  // ← Mount Admin Dashboard routes

// ✅ Session namespace handling
sessionSocket.on('connection', (socket) => {
  console.log('A user connected to session socket:', socket.id);
  
  const sessionId = socket.handshake.query.sessionId;
  console.log('Received sessionId:', sessionId);  // Log sessionId here
  
  // Join a room based on sessionId to isolate signaling messages
  if (sessionId) {
    socket.join(sessionId);
    console.log(`Socket ${socket.id} joined room ${sessionId}`);
  }

  // WebRTC Signaling: Call User
  socket.on('callUser', (data) => {
    // data: { userToCall, signalData, from, name, sessionId }
    console.log(`Initiating call from ${data.from} in session ${data.sessionId}`);
    
    socket.to(data.sessionId).emit('callUser', {
      signal: data.signalData,
      from: data.from,
      name: data.name
    });

    // Emit a global cross-page notification
    notificationSocket.to(`user_${data.userToCall}`).emit('incomingVideoCall', {
      from: data.from,
      name: data.name,
      sessionId: data.sessionId
    });
  });

  // WebRTC Signaling: Answer Call
  socket.on('answerCall', (data) => {
    // data: { signal, to, sessionId }
    console.log(`Answering call in session ${data.sessionId}`);
    socket.to(data.sessionId).emit('callAccepted', data.signal);
  });

  // WebRTC Signaling: Reject Call
  socket.on('rejectCall', (data) => {
    // data: { to, sessionId }
    console.log(`Rejecting call in session ${data.sessionId}`);
    socket.to(data.sessionId).emit('callRejected');
  });

  // WebRTC Signaling: ICE Candidates
  socket.on('iceCandidate', (data) => {
    // data: { candidate, sessionId }
    socket.to(data.sessionId).emit('iceCandidate', data.candidate);
  });

  // WebRTC Signaling: End Call
  socket.on('endCall', (data) => {
    // data: { sessionId }
    console.log(`Ending call in session ${data.sessionId}`);
    socket.to(data.sessionId).emit('callEnded');
  });
  
  socket.on('disconnect', () => {
    console.log('A user disconnected from session socket:', socket.id);
  });
});
  
// ✅ Notification namespace handling
notificationSocket.on('connection', (socket) => {
  console.log('A user connected to notification socket');
  
  socket.on('subscribeToNotifications', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`Notification socket ${socket.id} joined room user_${userId}`);
  });
    
  socket.on('disconnect', () => {
    console.log('A user disconnected from notification socket');
  });
});


// Default route
app.get('/', (req, res) => {
  res.send('SkillSwap API is running');
});
  
// Start the server
const port = process.env.PORT || 5000;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
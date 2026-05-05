// src/controllers/notificationController.js
const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const Session = require('../models/Session'); // <-- Add this line
const User = require('../models/User'); // Ensure we have the User model to validate userId

let notificationSocket; // Declare a separate socket for notifications

// Import setSocketIO from sessionController.js


// Set socket.io instance for notifications
const setSocket = (socketIO) => {
  notificationSocket = socketIO;  // Set the notification socket
};

// src/controllers/notificationController.js
const cron = require('node-cron');

cron.schedule('* * * * *', async () => {  // This runs every minute
  const now = new Date();

  const upcomingSessions = await Session.find({
    sessionTime: { $gt: now },  // Ensure the session is in the future
  });

  upcomingSessions.forEach(async (session) => {
    // Send reminder 1 hour before the session time
    if (new Date(session.sessionTime) - now <= 60 * 60 * 1000) {  // 1 hour before session
      const message = `Reminder: You have a scheduled session with ${session.userId1.name} at ${session.sessionTime}.`;

      await sendReminderNotification({
        sessionId: session._id,
        message,
        reminderTime: session.sessionTime,  // Schedule reminder 1 hour before session
      });
    }
  });
});

// Create a new notification (e.g., when a session request is made or a reminder)
const sendNotification = async (req, res) => {
  const { userId, message, type } = req.body;

  console.log('Received notification request:', req.body);

  if (!userId || !message || !type) {
    console.error('Missing required fields: userId, message, or type');
    return res.status(400).json({ msg: 'Please provide all required fields (userId, message, type)' });
  }

  try {
    // Convert userId to ObjectId
    const validUserId = new mongoose.Types.ObjectId(userId);

    const newNotification = new Notification({
      userId: validUserId,  // Ensure userId is an ObjectId
      message,
      type,
    });

    console.log('Saving new notification:', newNotification);

    await newNotification.save();  // Save notification to database

    // Emit notification to the user through the notification socket
    if (notificationSocket) {
      console.log('Emitting notification to user:', validUserId);
      notificationSocket.to(`user_${validUserId.toString()}`).emit('new_notification', {
        userId,
        message,
        type,
      });
    } else {
      console.error('Notification Socket.IO is not initialized!');
    }

    res.json({ msg: 'Notification created successfully', notification: newNotification });
  } catch (err) {
    console.error('Error creating notification:', err.message);
    res.status(500).send('Server error');
  }
};

// Get all notifications for a specific user
const getNotifications = async (req, res) => {
  const { userId } = req.params;

  try {
    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 }); // Latest notifications first
    res.json(notifications);
  } catch (err) {
    console.error('Error fetching notifications:', err.message);
    res.status(500).send('Server error');
  }
};

// Mark a specific notification as read
const markAsRead = async (req, res) => {
  const { notificationId } = req.params;

  try {
    const updatedNotification = await Notification.findByIdAndUpdate(notificationId, { isRead: true }, { new: true });
    res.json(updatedNotification);
  } catch (err) {
    console.error('Error marking notification as read:', err.message);
    res.status(500).send('Server error');
  }
};

// Mark all notifications for a user as read
const markAllAsRead = async (req, res) => {
  const { userId } = req.params;

  try {
    await Notification.updateMany({ userId, isRead: false }, { isRead: true });
    res.json({ msg: 'All notifications marked as read' });
  } catch (err) {
    console.error('Error marking all notifications as read:', err.message);
    res.status(500).send('Server error');
  }
};

// Function to send notification for a new scheduled session
const sendNewMeetingScheduledNotification = async (session, message) => {
  try {
    // Retrieve session and populate the user data
    if (!session) {
      console.log('Session not found!');
      return;
    }

    console.log('Retrieved session:', session);  // Log the session to check its contents

    // Ensure both userId1 and userId2 are properly converted to ObjectIds
    const userId1 = new mongoose.Types.ObjectId(session.userId1._id);  // Use new to properly create ObjectId
    const userId2 = new mongoose.Types.ObjectId(session.userId2._id);  // Use new to properly create ObjectId

    // Emit notification to both users via WebSocket
    notificationSocket.to(`user_${userId1}`).emit('newMeetingScheduled', { message });
    notificationSocket.to(`user_${userId2}`).emit('newMeetingScheduled', { message });

    console.log(`Notification sent to users ${userId1} and ${userId2}`);

    // Create and save the notifications in the database for both users
    //const Notification = require('./src/models/Notification'); // Assuming Notification model is in this location

    const notification1 = new Notification({
      userId: userId1,
      message: message,
      type: 'new_meeting_scheduled',
    });

    const notification2 = new Notification({
      userId: userId2,
      message: message,
      type: 'new_meeting_scheduled',
    });

    // Save both notifications to the database
    await notification1.save();
    await notification2.save();

    console.log(`Notifications saved for users ${userId1} and ${userId2}`);
  } catch (err) {
    console.error('Error sending new meeting scheduled notification:', err.message);
  }
};

// Send reminder notification (e.g., 1 hour before the session)
const sendReminderNotification = async (sessionId, message, reminderTime) => {
  try {
    const session = await Session.findById(sessionId).populate('userId1 userId2');
    if (!session) {
      return res.status(404).json({ msg: 'Session not found' });
    }

    const sender = session.userId1;
    const receiver = session.userId2;

    // Send reminder to both users
    await sendNotification(sender._id, message, 'reminder');
    await sendNotification(receiver._id, message, 'reminder');

    // Emit via socket
    if (notificationSocket) {
      notificationSocket.to(`user_${sender._id.toString()}`).emit('new_notification', {
        userId: sender._id,
        message,
        type: 'reminder',
      });
      notificationSocket.to(`user_${receiver._id.toString()}`).emit('new_notification', {
        userId: receiver._id,
        message,
        type: 'reminder',
      });
    }

  } catch (err) {
    console.error('Error sending reminder notification:', err.message);
  }
};

// New notification function for feedback request
const sendNotificationForFeedbackRequest = async (userId) => {
  try {
    const message = 'Please provide feedback for the completed/canceled session';
    const notification = new Notification({
      userId,
      message,
      type: 'feedback_request',
    });

    // Save notification to the database
    await notification.save();

    // Emit notification to user
    notificationSocket.to(`user_${userId.toString()}`).emit('new_notification', {
      userId,
      message,
      type: 'feedback_request',
    });

    console.log(`Feedback request sent to user ${userId}`);

  } catch (err) {
    console.error('Error sending feedback notification:', err.message);
  }
};

// New notification function for session cancellation
const sendNotificationForSessionCancellation = async (userId) => {
  try {
    const message = 'Your session has been canceled';
    const notification = new Notification({
      userId,
      message,
      type: 'session_canceled',
    });

    // Save notification to the database
    await notification.save();

    // Emit notification to user
    notificationSocket.to(`user_${userId.toString()}`).emit('new_notification', {
      userId,
      message,
      type: 'session_canceled',
    });

    console.log(`Session cancellation notification sent to user ${userId}`);
  } catch (err) {
    console.error('Error sending session canceled notification:', err.message);
  }
};


// Send session accepted notification
const sendSessionAcceptedNotification = async (acceptorId, requesterId, skill, sessionId) => {
  try {
    const acceptor = await User.findById(acceptorId);
    if (!acceptor) {
      console.error('Acceptor not found for notification');
      return;
    }

    const message = `${acceptor.name} has accepted your session request for ${skill}`;

    // Create notification
    const notification = new Notification({
      userId: requesterId,
      message,
      type: 'session_accepted',
      relatedId: sessionId,
    });

    await notification.save();

    // Emit notification
    if (notificationSocket) {
      notificationSocket.to(`user_${requesterId.toString()}`).emit('new_notification', {
        _id: notification._id,
        userId: requesterId,
        message,
        type: 'session_accepted',
        relatedId: sessionId,
        isRead: false
      });
    }

    console.log(`Session accepted notification sent to user ${requesterId}`);

  } catch (err) {
    console.error('Error sending session accepted notification:', err.message);
  }
};

// Send session request notification
const sendSessionRequestNotification = async (senderId, recipientId, skill, sessionId) => {
  try {
    const sender = await User.findById(senderId);
    if (!sender) {
      console.error('Sender not found for notification');
      return;
    }

    const message = `${sender.name} has requested a session for ${skill}`;

    // Create notification
    const notification = new Notification({
      userId: recipientId,
      message,
      type: 'session_request',
      relatedId: sessionId,
    });

    await notification.save();

    // Emit notification
    if (notificationSocket) {
      notificationSocket.to(`user_${recipientId.toString()}`).emit('new_notification', {
        _id: notification._id,
        userId: recipientId,
        message,
        type: 'session_request',
        relatedId: sessionId,
        isRead: false
      });
    }

    console.log(`Session request notification sent to user ${recipientId}`);

  } catch (err) {
    console.error('Error sending session request notification:', err.message);
  }
};

module.exports = { sendNotification, getNotifications, markAsRead, markAllAsRead, setSocket, sendReminderNotification, sendNewMeetingScheduledNotification, sendNotificationForFeedbackRequest, sendNotificationForSessionCancellation, sendSessionRequestNotification, sendSessionAcceptedNotification };  // Export setSocket
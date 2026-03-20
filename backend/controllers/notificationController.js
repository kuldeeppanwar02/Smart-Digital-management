const Notification = require('../models/Notification');
const User = require('../models/User');

// Generate a notification
exports.createNotification = async (userId, title, message, type) => {
  try {
    const notification = new Notification({
      user: userId,
      title,
      message,
      type
    });
    await notification.save();
    
    // Fake SMS/Email triggers for demonstration (Topper Move)
    const user = await User.findById(userId);
    if (user) {
      console.log(`[EMAIL SEND SIMULATION] To: ${user.email} | Subject: ${title} | Body: ${message}`);
      // SendGrid / Mailgun logic would go here
      
      console.log(`[SMS SEND SIMULATION] To: (User's Phone Number) | Message: [SmartEdu Alert] ${title}: ${message}`);
      // Twilio logic would go here
    }

    return notification;
  } catch (err) {
    console.error('Error creating notification:', err);
  }
};

// Get notifications for a user
exports.getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(30);
    res.json(notifications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching notifications' });
  }
};

// Mark as read
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { isRead: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    res.json(notification);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error marking notification as read' });
  }
};

// Mark all as read
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ message: 'All marked as read' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error marking all as read' });
  }
};

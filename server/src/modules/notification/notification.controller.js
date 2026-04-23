import Notification from './notification.model.js';

// GET: Fetch all notifications for a specific user
export const getUserNotifications = async (req, res) => {
    try {
        // In a real app, userId comes from the logged-in user token. 
        // We will hardcode '12345' for easy testing.
        const notifications = await Notification.find({ userId: '12345' }).sort({ createdAt: -1 });
        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// POST: Trigger a new notification (You can take a Postman screenshot of this!)
export const triggerNotification = async (req, res) => {
    try {
        const { title, message } = req.body;
        
        const newNotification = new Notification({
            userId: '12345', // Dummy user ID
            title: title,
            message: message
        });

        await newNotification.save();
        res.status(201).json({ message: "Notification triggered successfully", notification: newNotification });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PUT: Mark a notification as read
export const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        await Notification.findByIdAndUpdate(id, { isRead: true });
        res.status(200).json({ message: "Marked as read" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
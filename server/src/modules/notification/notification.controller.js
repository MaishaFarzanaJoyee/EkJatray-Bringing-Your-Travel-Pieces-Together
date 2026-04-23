import Notification from './notification.model.js';

// GET: Fetch all notifications for a specific user
export const getUserNotifications = async (req, res) => {
    try {
        const userId = req?.user?.userId;
        const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// POST: Trigger a new notification (You can take a Postman screenshot of this!)
export const triggerNotification = async (req, res) => {
    try {
        const { title, message } = req.body;
        const userId = req?.user?.userId;
        
        const newNotification = new Notification({
            userId,
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
        const userId = req?.user?.userId;
        await Notification.findOneAndUpdate({ _id: id, userId }, { isRead: true });
        res.status(200).json({ message: "Marked as read" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
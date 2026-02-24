const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const webpush = require('web-push');

const questionRoutes = require('./routes/questions');
const subscribeRoutes = require('./routes/subscribe');
const PushSubscription = require('./models/PushSubscription');

const app = express();

// Normalize FRONTEND_URL to avoid mismatched trailing-slash issues
const frontendUrlRaw = process.env.FRONTEND_URL || '';
const frontendUrlRaw2 = process.env.FRONTEND_URL2 || '';
const frontendUrl = frontendUrlRaw.replace(/\/+$/, '');
const frontendUrl2 = frontendUrlRaw2.replace(/\/+$/, '');
if (frontendUrl) {
  app.use(cors({ origin: [
    frontendUrl,
    frontendUrl2
  ],
  credentials: true }));
} else {
  // If no FRONTEND_URL provided, allow all origins (reasonable for local/dev)
  app.use(cors());
}

app.use(express.json());

// MongoDB connection (sanitize and validate URI)
const rawMongo = process.env.MONGODB_URI || '';
const sanitized = rawMongo.split('#')[0].trim();
let mongoUri = sanitized;
if (mongoUri && !mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) {
  console.warn('MONGODB_URI missing scheme, prepending mongodb://');
  mongoUri = `mongodb://${mongoUri}`;
}
if (!mongoUri) {
  console.error('MONGODB_URI is not set. Check backend/.env');
} else {
  mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err.message || err));
}

// VAPID keys
webpush.setVapidDetails(
  'mailto:your-email@example.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Routes
app.use('/api/questions', questionRoutes);
app.use('/api/subscribe', subscribeRoutes);

// Notification endpoint for cron job
app.get('/api/notify', async (req, res) => {
  try {
    const subscriptions = await PushSubscription.find();
    const payload = JSON.stringify({
      title: '📚 Time to learn!',
      body: 'You have questions waiting. Open the app and ask ChatGPT.',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png'
    });

    const sendPromises = subscriptions.map(sub => 
      webpush.sendNotification(sub, payload).catch(err => {
        // If subscription is invalid, remove it
        if (err.statusCode === 410) {
          PushSubscription.deleteOne({ endpoint: sub.endpoint }).exec();
        }
      })
    );
    await Promise.allSettled(sendPromises);
    res.json({ message: `Notifications sent to ${subscriptions.length} subscribers` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


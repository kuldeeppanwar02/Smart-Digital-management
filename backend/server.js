require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
// Allow requests from the live Vercel frontend and local development
app.use(cors({
  origin: [
    'https://smart-digital-management.vercel.app',
    'http://localhost:5173'
  ],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/schools', require('./routes/schoolRoutes'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/exams', require('./routes/exams'));
app.use('/api/marks', require('./routes/marks'));
app.use('/api/tuition', require('./routes/tuition'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/parent', require('./routes/parentRoutes'));
app.use('/api/fees', require('./routes/feeRoutes'));

// Health check
app.get('/', (req, res) => res.json({ message: 'Smart School System API Running ✅' }));

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('✅ MongoDB Connected');
    await seedAdmin();
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

// Seed default admin account on first run
async function seedAdmin() {
  const User = require('./models/User');
  const superadmin = await User.findOne({ role: 'superadmin' });
  
  if (!superadmin) {
    // Migrate old admin if it exists
    const oldAdmin = await User.findOne({ email: 'admin@school.com' });
    if (oldAdmin) {
      oldAdmin.role = 'superadmin';
      oldAdmin.schoolId = null;
      await oldAdmin.save();
      console.log('👑 Migrated old admin to Platform SuperAdmin: admin@school.com');
    } else {
      await User.create({
        name: 'SuperAdmin',
        email: 'admin@school.com',
        password: 'Admin@1234',
        role: 'superadmin',
        isApproved: true,
        schoolId: null // Platform owner
      });
      console.log('👑 Platform SuperAdmin created: admin@school.com / Admin@1234');
    }
  }
}

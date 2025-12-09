const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function updateUserStatus() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Update all users without onlineStatus to 'offline'
    const result = await User.updateMany(
      { $or: [{ onlineStatus: null }, { onlineStatus: { $exists: false } }] },
      { $set: { onlineStatus: 'offline' } }
    );
    
    console.log('✅ Updated', result.modifiedCount, 'users to offline status');
    
    // Show all users
    const users = await User.find().select('name email onlineStatus');
    console.log('\nAll users:');
    users.forEach(u => {
      console.log(`- ${u.name} (${u.email}): ${u.onlineStatus || 'undefined'}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

updateUserStatus();

const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const users = await User.find().select('name email role status createdAt');
    console.log('\n=== Total Users:', users.length, '===\n');
    
    users.forEach(u => {
      console.log({
        name: u.name,
        email: u.email,
        role: u.role || 'undefined',
        status: u.status || 'undefined',
        created: u.createdAt
      });
    });
    
    console.log('\n=== Stats ===');
    console.log('Users with role "user":', users.filter(u => u.role === 'user').length);
    console.log('Users with role "admin":', users.filter(u => u.role === 'admin').length);
    console.log('Users with status "active":', users.filter(u => u.status === 'active').length);
    console.log('Users with status "banned":', users.filter(u => u.status === 'banned').length);
    console.log('Users with undefined status:', users.filter(u => !u.status).length);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkUsers();

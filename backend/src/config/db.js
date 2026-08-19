const mongoose = require('mongoose');
const env = require('./env');

const migrateExistingUsernames = async () => {
  try {
    const User = require('../models/User');
    const users = await User.find({ $or: [{ username: { $exists: false } }, { username: null }] });
    if (users.length > 0) {
      console.log(`[MIGRATION] Found ${users.length} users without a username. Generating unique usernames...`);
      for (const user of users) {
        const base = (user.name || user.email.split('@')[0]).toLowerCase().replace(/[^a-z0-9]/g, '_');
        let username = base;
        let count = 1;
        while (await User.findOne({ username, _id: { $ne: user._id } })) {
          username = `${base}_${count}`;
          count++;
        }
        user.username = username;
        await user.save({ validateBeforeSave: false });
        console.log(`[MIGRATION] Assigned username "${username}" to user ${user.email}`);
      }
      console.log(`[MIGRATION] Username migration completed.`);
    }
  } catch (error) {
    console.error(`[MIGRATION] Username migration failed:`, error);
  }
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    await migrateExistingUsernames();
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50
    },
    username: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      select: false
    },
    avatar: {
      type: String,
      default: 'https://api.dicebear.com/7.x/avataaars/svg?seed=placeholder'
    },
    isOnline: {
      type: Boolean,
      default: false
    },
    lastSeen: {
      type: Date
    },
    refreshTokens: [
      {
        type: String
      }
    ],
    jobTitle: {
      type: String,
      trim: true,
      maxlength: 100
    },
    department: {
      type: String,
      trim: true,
      maxlength: 100
    },
    location: {
      type: String,
      trim: true,
      maxlength: 100
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 500
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 20
    },
    linkedin: {
      type: String,
      trim: true
    },
    github: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

userSchema.pre('save', async function () {
  if (!this.username && this.name) {
    this.username = this.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  }
});

const User = mongoose.model('User', userSchema);
module.exports = User;

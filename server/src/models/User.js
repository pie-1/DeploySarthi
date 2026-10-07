const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, default: '', trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  avatar: { type: String, default: '' },

  notifications: {
    telegramEnabled: { type: Boolean, default: false },
    criticalOnly: { type: Boolean, default: false },
    emailEnabled: { type: Boolean, default: false },
    whatsappEnabled: { type: Boolean, default: false },
  },

  telegram: {
    connected: { type: Boolean, default: false },
    chatId: { type: String, default: '' },
    username: { type: String, default: '' },
    firstName: { type: String, default: '' },
    linkToken: { type: String, default: '' },
    linkTokenExpiresAt: { type: Date, default: null },
    connectedAt: { type: Date, default: null },
  },

  github: {
    connected: { type: Boolean, default: false },
    accessToken: { type: String, default: '' },   // encrypted
    login: { type: String, default: '' },
    avatar: { type: String, default: '' },
    connectedAt: { type: Date, default: null },
  },

  // ─────────────────────────────────────────────────────────────
  // VERCEL — now per-user, encrypted
  // ─────────────────────────────────────────────────────────────
  vercel: {
    connected: { type: Boolean, default: false },
    accessToken: { type: String, default: '' },   // encrypted via crypto.js
    userId: { type: String, default: '' },
    username: { type: String, default: '' },
    email: { type: String, default: '' },
    teamId: { type: String, default: '' },
    teamName: { type: String, default: '' },
    connectedAt: { type: Date, default: null },
  },

  projects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
}, { timestamps: true });

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.generateTelegramLinkToken = function () {
  const token = crypto.randomBytes(16).toString('hex');
  this.telegram.linkToken = token;
  this.telegram.linkTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
  return token;
};

userSchema.methods.isTelegramLinkTokenValid = function (token) {
  if (!this.telegram.linkToken || !this.telegram.linkTokenExpiresAt) return false;
  if (this.telegram.linkToken !== token) return false;
  if (this.telegram.linkTokenExpiresAt < new Date()) return false;
  return true;
};

userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    if (ret.github) delete ret.github.accessToken;
    if (ret.vercel) delete ret.vercel.accessToken;
    if (ret.telegram) {
      delete ret.telegram.linkToken;
      delete ret.telegram.linkTokenExpiresAt;
    }
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
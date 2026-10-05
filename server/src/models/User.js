const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, default: '', trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  avatar: { type: String, default: '' },

  github: {
    connected: { type: Boolean, default: false },
    accessToken: { type: String, default: '' },
    login: { type: String, default: '' },
    avatar: { type: String, default: '' },
    connectedAt: { type: Date, default: null },
  },

  vercel: {
    connected: { type: Boolean, default: false },
    accessToken: { type: String, default: '' },
    userId: { type: String, default: '' },
    username: { type: String, default: '' },
    email: { type: String, default: '' },
    connectedAt: { type: Date, default: null },
  },

  projects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    if (ret.github) delete ret.github.accessToken;
    if (ret.vercel) delete ret.vercel.accessToken;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
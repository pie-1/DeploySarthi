const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  description: {
    type: String,
    default: '',
    maxlength: 500,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  githubRepo: {
    type: String,
    default: '',
  },
  deploymentUrl: {
    type: String,
    default: '',
  },
  deploymentTarget: {
    type: String,
    enum: ['vercel', 'aws_apprunner', 'none'],
    default: 'none',
  },
  environment: {
    type: String,
    enum: ['development', 'staging', 'production'],
    default: 'development',
  },
  status: {
    type: String,
    enum: ['healthy', 'warning', 'critical', 'unknown'],
    default: 'unknown',
  },
  connectedServices: {
    aws: { type: Boolean, default: false },
    vercel: { type: Boolean, default: false },
    supabase: { type: Boolean, default: false },
  },
  costToday: {
    type: Number,
    default: 0,
  },
  lastDeployedAt: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

projectSchema.index({ owner: 1, createdAt: -1 });

projectSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Project', projectSchema);
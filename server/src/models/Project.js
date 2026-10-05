const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, default: '', maxlength: 500 },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  // GitHub
  githubRepo: { type: String, default: '' },
  githubRepoId: { type: Number },
  githubDefaultBranch: { type: String, default: 'main' },
  githubLanguage: { type: String, default: '' },
  githubStars: { type: Number, default: 0 },
  githubIsPrivate: { type: Boolean, default: false },

  // Vercel
  vercelProjectId: { type: String, default: '' },
  vercelProjectName: { type: String, default: '' },
  vercelUrl: { type: String, default: '' },
  vercelFramework: { type: String, default: '' },

  // Public gallery
  isPublic: { type: Boolean, default: false, index: true },
  publishedAt: { type: Date, default: null },
  publishedDescription: { type: String, default: '', maxlength: 1000 },
  tags: [{ type: String, trim: true }],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  likeCount: { type: Number, default: 0, index: true },
  views: { type: Number, default: 0 },
  commentCount: { type: Number, default: 0 },

  // App-level
  deploymentUrl: { type: String, default: '' },
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
  costToday: { type: Number, default: 0 },
  lastDeployedAt: { type: Date, default: null },
}, { timestamps: true });

projectSchema.index({ owner: 1, createdAt: -1 });
projectSchema.index({ isPublic: 1, likeCount: -1 });
projectSchema.index({ isPublic: 1, publishedAt: -1 });

projectSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Project', projectSchema);
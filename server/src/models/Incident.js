const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    maxlength: 200,
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'critical'],
    default: 'warning',
    index: true,
  },
  status: {
    type: String,
    enum: ['open', 'acknowledged', 'resolved'],
    default: 'open',
    index: true,
  },
  symptoms: [{
    service: String,
    metric: String,
    value: Number,
    baseline: Number,
    changePercent: Number,
  }],
  timeline: [{
    timestamp: String,
    service: String,
    event: String,
  }],
  relatedDeployment: {
    commitId: String,
    branch: String,
    filesChanged: [String],
  },
  aiAnalysis: {
    summary: String,
    likelyCause: String,
    evidence: [String],
    suggestedInvestigation: String,
    confidence: String,
    confidenceReason: String,
    generatedAt: { type: Date, default: Date.now },
  },
  costImpact: {
    estimated: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
  },
  startedAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  acknowledgedAt: Date,
  resolvedAt: Date,
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  resolutionNotes: String,
}, { timestamps: true });

incidentSchema.index({ project: 1, startedAt: -1 });
incidentSchema.index({ status: 1, severity: 1 });

incidentSchema.virtual('duration').get(function () {
  const end = this.resolvedAt || new Date();
  return end - this.startedAt;
});

incidentSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Incident', incidentSchema);
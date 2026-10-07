const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true,
  },
  title: { type: String, required: true, maxlength: 200 },
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
    level: { type: String, enum: ['warning', 'critical', ''], default: '' },
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

  // ─────────────────────────────────────────────────────────────
  // AI ANALYSIS — now matches Python output exactly
  // ─────────────────────────────────────────────────────────────
  aiAnalysis: {
    summary: String,
    likelyCause: String,
    evidence: [String],
    confidence: String,
    confidenceReason: String,
    recommendedNext: String,          // ← was missing before
    suggestedQuestions: [String],     // ← was missing before
    suggestedInvestigation: String,   // kept for backward compat
    analysisSource: {
      type: String,
      enum: ['groq', 'fallback', 'rules', ''],
      default: '',
    },
    fallbackReason: String,
    generatedAt: { type: Date, default: Date.now },
  },

  // ─────────────────────────────────────────────────────────────
  // USER FEEDBACK
  // ─────────────────────────────────────────────────────────────
  feedback: {
    rating: {
      type: String,
      enum: ['correct', 'partial', 'wrong', ''],
      default: '',
    },
    comment: { type: String, default: '', maxlength: 500 },
    ratedAt: { type: Date, default: null },
    ratedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },

  // ─────────────────────────────────────────────────────────────
  // COST IMPACT
  // ─────────────────────────────────────────────────────────────
  costImpact: {
    estimated: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    costPerHour: { type: Number, default: 0 },
    costPerHourBaseline: { type: Number, default: 0 },
    changePercent: { type: Number, default: 0 },
  },

  // ─────────────────────────────────────────────────────────────
  // ALERT AUDIT TRAIL
  // ─────────────────────────────────────────────────────────────
  alertsSent: [{
    channel: { type: String, enum: ['telegram', 'email', 'whatsapp'] },
    sentAt: { type: Date, default: Date.now },
    success: { type: Boolean, default: true },
    error: { type: String, default: '' },
  }],

  startedAt: { type: Date, default: Date.now, index: true },
  acknowledgedAt: Date,
  resolvedAt: Date,
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolutionNotes: String,
}, { timestamps: true });

incidentSchema.index({ project: 1, startedAt: -1 });
incidentSchema.index({ status: 1, severity: 1 });
incidentSchema.index({ project: 1, status: 1, startedAt: -1 });

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
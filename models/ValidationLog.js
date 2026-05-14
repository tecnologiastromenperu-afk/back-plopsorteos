import mongoose from 'mongoose';

const validationLogSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      uppercase: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },
    documentId: {
      type: String,
      required: true,
      index: true,
    },
    fullName: {
      type: String,
      required: false,
    },
    phone: {
      type: String,
      required: false,
    },
    product: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      enum: ['valid', 'invalid', 'expired', 'max_uses_exceeded', 'recaptcha_failed', 'not_found'],
      required: true,
      index: true,
    },
    prize: {
      // Mixed avoids `type` key conflicts for prize payloads like { type, description }
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    prizeDeliveryStatus: {
      type: String,
      enum: ['pending', 'delivered'],
      default: 'pending',
      index: true,
    },
    recaptchaScore: {
      type: Number,
      default: null,
    },
    userAgent: {
      type: String,
      required: false,
    },
    ipAddress: {
      type: String,
      required: false,
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    reason: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: false,
  }
);

// Index for querying validation logs
validationLogSchema.index({ timestamp: -1, status: 1 });
validationLogSchema.index({ email: 1, timestamp: -1 });
validationLogSchema.index({ ipAddress: 1, timestamp: -1 });
validationLogSchema.index({ status: 1, prizeDeliveryStatus: 1, timestamp: -1 });
validationLogSchema.index({ code: 1, documentId: 1, status: 1, timestamp: -1 });

export default mongoose.model('ValidationLog', validationLogSchema);

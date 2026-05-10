import mongoose from 'mongoose';

const promotionalCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    prize: {
      type: {
        type: String, // e.g., 'TV', 'VIAJE', 'EQUIPO_SONIDO'
        required: true,
      },
      description: {
        type: String, // e.g., 'Samsung 55 pulgadas', 'Viaje a Cancún'
        required: true,
      },
    },
    maxUses: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    expirationDate: {
      type: Date,
      required: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    product: {
      type: String, // e.g., 'MAX-FL MEDIANO' from the request
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index pour optimizar búsquedas
promotionalCodeSchema.index({ code: 1, isActive: 1, expirationDate: 1 });

export default mongoose.model('PromotionalCode', promotionalCodeSchema);

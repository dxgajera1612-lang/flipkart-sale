import mongoose from 'mongoose';

const ZipCodeSchema = new mongoose.Schema({
  zipCode: {
    type: String,
    required: [true, 'Zip code is required'],
    unique: true,
    trim: true,
    index: true
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true,
    index: true
  },
  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true,
    index: true
  },
  deliveryDays: {
    type: Number,
    required: true,
    default: 5,
    min: [1, 'Delivery days must be at least 1'],
    max: [30, 'Delivery days cannot exceed 30']
  },
  codAvailable: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true
});

// Create compound index for better search performance
ZipCodeSchema.index({ zipCode: 1, isActive: 1 });
ZipCodeSchema.index({ city: 1, state: 1 });

export default mongoose.models.ZipCode || mongoose.model('ZipCode', ZipCodeSchema);

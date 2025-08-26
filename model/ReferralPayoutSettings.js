import mongoose from 'mongoose';

const referralPayoutSettingsSchema = new mongoose.Schema({
  minPayoutAmount: {
    type: Number,
    required: true,
    default: 5000,
    min: 1000 
  },
    referralPercentage: {
    type: Number,
    required: true,
    default: 1.5, // 1.5% by default
    min: 0, // Minimum 0%
    max: 100 // Maximum 100%
  }
}, { timestamps: true });

const ReferralPayoutSettings = mongoose.models?.ReferralPayoutSettings || 
  mongoose.model('ReferralPayoutSettings', referralPayoutSettingsSchema);

export default ReferralPayoutSettings;
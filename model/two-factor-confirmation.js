import mongoose from 'mongoose';

const twoFactorConfirmationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    }
  },
  { timestamps: true }
);

const TwoFactorConfirmation = mongoose.models?.TwoFactorConfirmation || 
  mongoose.model('TwoFactorConfirmation', twoFactorConfirmationSchema);

export default TwoFactorConfirmation;
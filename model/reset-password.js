import mongoose from 'mongoose';

const resetTokenSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    expires: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Compound unique index on [email, token]
resetTokenSchema.index({ email: 1, token: 1 }, { unique: true });

// TTL index for automatic expiration cleanup
resetTokenSchema.index({ expires: 1 }, { expireAfterSeconds: 0 });

const ResetToken = mongoose.models?.ResetToken || 
  mongoose.model('ResetToken', resetTokenSchema);

export default ResetToken;
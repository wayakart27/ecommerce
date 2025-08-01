import mongoose from 'mongoose';

const twoFactorTokenSchema = new mongoose.Schema(
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
      validate: {
        validator: function(value) {
          // Check if the value is a valid date and in the future
          return value instanceof Date && !isNaN(value) && value > new Date();
        },
        message: props => `${props.value} is not a valid future date!`
      },
    },
    type: {
      type: String,
      enum: ['email', 'authenticator', 'sms'],
      default: 'email'
    },
    used: {
      type: Boolean,
      default: false
    },
    ipAddress: {
      type: String,
      required: false
    }
  },
  {
    timestamps: true,
  }
);

// Compound index for better query performance
twoFactorTokenSchema.index({ email: 1, token: 1 }, { unique: true });

const TwoFactorToken = mongoose.models?.TwoFactorToken || 
  mongoose.model('TwoFactorToken', twoFactorTokenSchema);

export default TwoFactorToken;
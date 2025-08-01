import mongoose from 'mongoose';
import TwoFactorConfirmation from './two-factor-confirmation';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      uppercase: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['Admin', 'User', 'Customer'],
      default: 'Customer',
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
    },
    image: {
      type: String,
      default: '',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isTwoFactorEnabled: {
      type: Boolean,
      default: false
    },
    twoFactorConfirmation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TwoFactorConfirmation'
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    whatsAppPhone: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Add cascade delete middleware
userSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  try {
    // Delete the associated TwoFactorConfirmation when user is deleted
    if (this.twoFactorConfirmation) {
      await TwoFactorConfirmation.findByIdAndDelete(this.twoFactorConfirmation);
    }
    next();
  } catch (err) {
    next(err);
  }
});

// Also handle findByIdAndDelete
userSchema.pre('findOneAndDelete', async function(next) {
  try {
    const user = await this.model.findOne(this.getFilter());
    if (user?.twoFactorConfirmation) {
      await TwoFactorConfirmation.findByIdAndDelete(user.twoFactorConfirmation);
    }
    next();
  } catch (err) {
    next(err);
  }
});

const User = mongoose.models?.User || mongoose.model('User', userSchema);

export default User;
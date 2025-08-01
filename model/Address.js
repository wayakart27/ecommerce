import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  firstName: {
    type: String,
    required: [true, 'First name is required']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required']
  },
  address: {
    type: String,
    required: [true, 'Address is required']
  },
  city: {
    type: String,
    required: [true, 'City is required'],
  },
  state: {
    type: String,
    required: [true, 'State is required'],
  },
  email: {
    type: String,
    required: [true, 'Email is required']
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    default: 'Nigeria'
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required']
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    enum: ['home', 'work', 'other'],
    default: 'home'
  }
}, {
  timestamps: true
});

// Ensure only one default address per user
addressSchema.pre('save', async function(next) {
  if (this.isDefault) {
    await this.constructor.updateMany(
      { user: this.user },
      { $set: { isDefault: false } }
    );
  }
  next();
});

export const Address = mongoose.models.Address|| mongoose.model('Address', addressSchema);
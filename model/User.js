// models/User.js
import mongoose from 'mongoose';
import TwoFactorConfirmation from './two-factor-confirmation';
import { Order } from './Order';
import ReferralPayoutSettings from './ReferralPayoutSettings';

const generateReferralCode = () => {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

/* ===========================
   SUB-SCHEMAS
=========================== */
const pendingReferralSchema = new mongoose.Schema({
  referee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  date: { type: Date, default: Date.now },
  hasPurchased: { type: Boolean, default: false },
  signupIp: String,
  deviceInfo: String
}, { _id: false });

const completedReferralSchema = new mongoose.Schema({
  referee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  amount: Number,
  date: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'completed', 'rejected'], default: 'pending' },
  paymentStatus: { type: String, enum: ['pending', 'success', 'rejected', 'failed', 'processing'], default: 'pending' },
  paymentRequest: { type: Boolean, default: false }
}, { _id: false });

const payoutHistorySchema = new mongoose.Schema({
  amount: Number,
  requestedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
  paymentStatus: { type: String, enum: ['pending', 'success', 'rejected', 'failed', 'processing'], default: 'pending' },
  bankDetails: {
    accountName: String,
    accountNumber: String,
    bankCode: String,
    verified: { type: Boolean, default: false }
  },
  paystackReference: String,
  processedAt: Date
}, { _id: false });

const bankDetailsSchema = new mongoose.Schema({
  accountName: String,
  accountNumber: String,
  bankCode: String,
  verified: { type: Boolean, default: false }
}, { _id: false });

const referralProgramSchema = new mongoose.Schema({
  referralCode: {
    type: String,
    unique: true,
    default: generateReferralCode,
    trim: true,
  },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  pendingReferrals: [pendingReferralSchema],
  completedReferrals: [completedReferralSchema],
  paystackRecipientCode: String,
  bankDetails: bankDetailsSchema,
  minPayoutAmount: { type: mongoose.Schema.Types.ObjectId, ref: 'ReferralPayoutSettings' },
  payoutHistory: [payoutHistorySchema]
}, { _id: false });

const deviceSchema = new mongoose.Schema({
  userAgent: String,
  ipAddress: String,
  firstSeen: { type: Date, default: Date.now },
  lastSeen: { type: Date, default: Date.now }
}, { _id: false });

const complianceSchema = new mongoose.Schema({
  signupIp: String,
  signupUserAgent: String,
  devices: [deviceSchema],
  lastLogin: Date,
  lastIp: String,
  kycVerified: { type: Boolean, default: false },
  consentTimestamp: Date
}, { _id: false });

/* ===========================
   MAIN USER SCHEMA
=========================== */
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, uppercase: true },
    email: { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true },
    role: { type: String, enum: ['Admin', 'User', 'Customer'], default: 'Customer' },
    password: { type: String, required: [true, 'Password is required'] },
    image: { type: String, default: '' },

    isVerified: { type: Boolean, default: false },
    isTwoFactorEnabled: { type: Boolean, default: false },
    twoFactorConfirmation: { type: mongoose.Schema.Types.ObjectId, ref: 'TwoFactorConfirmation' },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    phone: { type: String, trim: true, default: '' },

    referralProgram: referralProgramSchema,
    compliance: complianceSchema,

    hasMadePurchase: { type: Boolean, default: false },
    firstPurchaseDate: Date,
    lastPurchaseDate: Date
  },
  { timestamps: true }
);

/* ===========================
   MIDDLEWARE
=========================== */
userSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  try {
    if (this.twoFactorConfirmation) {
      await TwoFactorConfirmation.findByIdAndDelete(this.twoFactorConfirmation);
    }
    next();
  } catch (err) {
    next(err);
  }
});

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

/* ===========================
   METHODS
=========================== */
userSchema.methods.checkPayoutEligibility = function() {
  const minPayout = this.referralProgram.minPayoutAmount || 500000;
  
  return {
    eligible: this.referralProgram.referralEarnings >= minPayout,
    currentBalance: this.referralProgram.referralEarnings,
    required: Math.max(0, minPayout - this.referralProgram.referralEarnings),
    currency: 'kobo',
    minPayoutAmount: minPayout
  };
};

userSchema.methods.updateBankDetails = async function(details) {
  this.referralProgram.bankDetails = {
    accountName: details.accountName,
    accountNumber: details.accountNumber,
    bankCode: details.bankCode,
    verified: false
  };
  await this.save();
};

userSchema.methods.addDevice = async function(ipAddress, userAgent) {
  const existingDevice = this.compliance.devices.find(
    device => device.userAgent === userAgent && device.ipAddress === ipAddress
  );

  if (existingDevice) {
    existingDevice.lastSeen = new Date();
  } else {
    this.compliance.devices.push({
      userAgent,
      ipAddress,
      firstSeen: new Date(),
      lastSeen: new Date()
    });
  }

  await this.save();
};

/* ===========================
   INIT MODEL
=========================== */
const User = mongoose.models?.User || mongoose.model('User', userSchema);

/* ===========================
   OPTIONAL: INDEX SETUP (DEV ONLY)
=========================== */
export const setupIndexes = async () => {
  try {
    const existingIndexes = await User.collection.indexes();
    const existingIndexNames = existingIndexes.map(idx => idx.name);

    const indexesToCreate = [
      { key: { 'referralProgram.referredBy': 1 }, options: { name: 'referredBy_index', background: true } },
      { key: { 'compliance.kycVerified': 1 }, options: { name: 'kycVerified_index', background: true } },
      { key: { 'compliance.devices.ipAddress': 1 }, options: { name: 'ipAddress_index', background: true } }
    ];

    for (const { key, options } of indexesToCreate) {
      if (!existingIndexNames.includes(options.name)) {
        await User.collection.createIndex(key, options);
        console.log(`✅ Created index: ${options.name}`);
      }
    }

    console.log('✅ User model indexes verified');
  } catch (error) {
    console.error('❌ Error setting up indexes:', error);
  }
};

// Run only locally, not on Netlify
if (process.env.NODE_ENV === 'development') {
  setupIndexes();
}

export default User;

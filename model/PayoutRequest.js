import mongoose from 'mongoose';

const payoutRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 10000
  },
  bankDetails: {
    accountName: String,
    accountNumber: String,
    bankCode: String
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  paystackReference: String,
  failureReason: String,
  processedAt: Date
}, { timestamps: true });

const PayoutRequest = mongoose.models?.PayoutRequest || 
  mongoose.model('PayoutRequest', payoutRequestSchema);

export default PayoutRequest;
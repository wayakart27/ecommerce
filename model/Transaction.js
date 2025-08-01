const transactionSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Transaction must reference an order']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Transaction must belong to a user']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  paymentMethod: {
    type: String,
    required: [true, 'Payment method is required'],
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: ['pending', 'completed', 'failed', 'refunded', 'partially_refunded'],
    default: 'pending'
  },
  transactionId: {
    type: String,
    required: [true, 'Transaction ID is required']
  },
  address: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Address'
  }
}, {
  timestamps: true
});

export const Transaction = mongoose.miodels?.Transaction || mongoose.model('Transaction', transactionSchema);

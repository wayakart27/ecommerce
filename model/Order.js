import mongoose from "mongoose";

// Helper functions to generate IDs
const generateOrderId = () => `ORD-${Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join('')}`;
const generateTrackingId = () => `TRK-${Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join('')}`;
const generatePendingTransactionId = () => `pending-${Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join('')}`;

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Order must belong to a user'],
    index: true
  },
  orderId: {
    type: String,
    unique: true,
    required: true,
    default: generateOrderId,
    index: true
  },
  trackingId: {
    type: String,
    unique: true,
    required: true,
    default: generateTrackingId,
    index: true
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true,
    index: true,
    default: generatePendingTransactionId,
    validate: {
      validator: v => v.startsWith("pending-") || v.length >= 6,
      message: "Transaction ID must be at least 6 characters"
    }
  },
  orderItems: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
        index: true
      },
      name: String,
      quantity: {
        type: Number,
        required: true,
        min: [1, 'Quantity can not be less than 1']
      },
      discountedPrice: {
        type: Number,
        required: true
      },
    }
  ],
  shippingAddress: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Address',
    required: [true, 'Please provide shipping address']
  },
  paymentMethod: {
    type: String,
    required: [true, 'Please provide payment method'],
    index: true
  },
  itemsPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  shippingPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  totalPrice: {
    type: Number,
    required: true,
    default: 0.0,
    index: true
  },
  isPaid: {
    type: Boolean,
    required: true,
    default: false,
    index: true
  },
  paidAt: {
    type: Date,
    index: true
  },
  isDelivered: {
    type: Boolean,
    required: true,
    default: false,
    index: true
  },
  deliveredAt: {
    type: Date,
    index: true
  },
  isOrderReceived: {
    type: Boolean,
    required: true,
    default: false,
    index: true
  },
  orderReceivedAt: {
    type: Date,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending',
    index: true
  },
  estimatedDeliveryDate: {
    type: Date,
    index: true
  },
  shippingCarrier: {
    type: String,
    default: 'Express Delivery',
    index: true
  },
  statusTrack: {
    type: [{
      status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
        required: true
      },
      date: {
        type: Date,
        default: Date.now,
        required: true
      },
    }],
    default: function() {
      return [{
        status: this.isPaid ? 'processing' : 'pending',
        date: new Date()
      }];
    }
  }
}, {
  timestamps: true
});

// Indexes
orderSchema.index({ user: 1, status: 1 });
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: 1 });
orderSchema.index({ isPaid: 1, isDelivered: 1 });
orderSchema.index({ totalPrice: 1, createdAt: 1 });
orderSchema.index({ 'statusTrack.status': 1, 'statusTrack.date': 1 });

// Pre-save hook for price calculation
orderSchema.pre('save', function(next) {
  if (this.isModified('orderItems')) {
    this.itemsPrice = this.orderItems.reduce(
      (acc, item) => acc + (item.discountedPrice * item.quantity), 0
    );
    this.totalPrice = this.itemsPrice + this.shippingPrice;
  }
  next();
});

export const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
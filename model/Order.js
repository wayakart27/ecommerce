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
  // Embedded address object instead of reference
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true
  },
  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    trim: true,
    default: 'Nigeria'
  },
  postalCode: {
    type: String,
    default: '',
    trim: true
  },
  additionalInfo: {
    type: String,
    default: '',
    trim: true
  }
},
  paymentMethod: {
    type: String,
    required: [true, 'Please provide payment method'],
    index: true
  },
  // Simplified payment details for Paystack
  paymentDetails: {
    channel: {
      type: String,
      enum: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer', 'other'],
      default: 'card'
    },
    bank: {
      type: String,
      trim: true
    },
    cardType: {
      type: String,
      trim: true
    },
    authorizationCode: {
      type: String,
      trim: true
    },
    last4: {
      type: String,
      maxlength: 4
    }
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
  // Indicates if this is a referral order
  isReferral: {
    type: Boolean,
    default: false,
    index: true
  },
  // Referral bonus information
  referralBonus: {
    referrer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    amount: {
      type: Number,
      default: 0
    },
    percentage: {
      type: Number,
      default: 0
    },
    processedAt: {
      type: Date
    }
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
orderSchema.index({ 'referralBonus.referrer': 1 });
orderSchema.index({ 'paymentDetails.channel': 1 });

// Indexes for shipping address fields (optional, for better querying)
orderSchema.index({ 'shippingAddress.city': 1 });
orderSchema.index({ 'shippingAddress.state': 1 });
orderSchema.index({ 'shippingAddress.country': 1 });

// Pre-save hook for price calculation
orderSchema.pre('save', function(next) {
  if (this.isModified('orderItems') || this.isModified('shippingPrice')) {
    this.itemsPrice = this.orderItems.reduce(
      (acc, item) => acc + (item.discountedPrice * item.quantity), 0
    );
    this.totalPrice = this.itemsPrice + this.shippingPrice;
  }
  next();
});

// Pre-save hook to prevent shipping address updates after payment
orderSchema.pre("save", async function (next) {
  if (!this.isNew && this.isModified("shippingAddress")) {
    try {
      const originalOrder = await this.constructor.findById(this._id).lean();
      if (originalOrder && originalOrder.isPaid) {
        // Revert all shipping address fields to their original values
        this.shippingAddress = originalOrder.shippingAddress;
      }
    } catch (err) {
      return next(err);
    }
  }
  next();
});

// Handle direct update queries (findOneAndUpdate, findByIdAndUpdate)
orderSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();
  
  // Check if any shipping address field is being updated
  const isShippingAddressModified = update && (
    update.shippingAddress || 
    update.$set?.shippingAddress ||
    Object.keys(update).some(key => key.startsWith('shippingAddress.'))
  );
  
  if (isShippingAddressModified) {
    try {
      const docToUpdate = await this.model.findOne(this.getQuery()).lean();
      if (docToUpdate && docToUpdate.isPaid) {
        // Remove all shipping address fields from the update
        if (update.shippingAddress) delete update.shippingAddress;
        if (update.$set?.shippingAddress) delete update.$set.shippingAddress;
        
        // Remove individual shipping address fields
        Object.keys(update).forEach(key => {
          if (key.startsWith('shippingAddress.')) {
            delete update[key];
          }
        });
        
        if (update.$set) {
          Object.keys(update.$set).forEach(key => {
            if (key.startsWith('shippingAddress.')) {
              delete update.$set[key];
            }
          });
        }
        
        this.setUpdate(update);
      }
    } catch (err) {
      return next(err);
    }
  }
  next();
});

export const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
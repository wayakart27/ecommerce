const { states } = require('@/data/states');
const mongoose = require('mongoose');

const nigeriaShippingSchema = new mongoose.Schema({
  defaultPrice: {
    type: Number,
    required: [true, 'Default shipping price is required'],
    min: [0, 'Shipping price cannot be negative'],
    default: 1500
  },
  
  // NEW: Default delivery days for all locations
  defaultDeliveryDays: {
    type: Number,
    required: [true, 'Default delivery days are required'],
    min: [1, 'Delivery days must be at least 1'],
    default: 2
  },
  
  freeShippingThreshold: {
    type: Number,
    min: [0, 'Free shipping threshold cannot be negative'],
    default: 20000
  },
  
  statePrices: [{
    state: {
      type: String,
      required: [true, 'State name is required'],
      enum: states.map(s => s.state)
    },
    price: {
      type: Number,
      required: [true, 'Shipping price is required'],
      min: [0, 'Shipping price cannot be negative']
    },
    // NEW: State-level delivery days (optional)
    deliveryDays: {
      type: Number,
      min: [1, 'Delivery days must be at least 1']
    },
    freeShippingThreshold: {
      type: Number,
      min: [0, 'Free shipping threshold cannot be negative']
    }
  }],
  
  cityPrices: [{
    state: {
      type: String,
      required: [true, 'State name is required'],
      enum: states.map(s => s.state)
    },
    city: {
      type: String,
      required: [true, 'City name is required'],
      validate: {
        validator: function(city) {
          const state = states.find(s => s.state === this.state);
          return state ? state.lgas.includes(city) : false;
        },
        message: props => `${props.value} is not a valid city for the selected state`
      }
    },
    price: {
      type: Number,
      required: [true, 'Shipping price is required'],
      min: [0, 'Shipping price cannot be negative']
    },
    // NEW: City-level delivery days (optional)
    deliveryDays: {
      type: Number,
      min: [1, 'Delivery days must be at least 1']
    },
    freeShippingThreshold: {
      type: Number,
      min: [0, 'Free shipping threshold cannot be negative']
    }
  }],

  isActive: {
    type: Boolean,
    default: true
  },
  
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

nigeriaShippingSchema.index({ 'statePrices.state': 1 });
nigeriaShippingSchema.index({ 'cityPrices.state': 1, 'cityPrices.city': 1 });

nigeriaShippingSchema.statics.calculateNigeriaShipping = async function(location, orderTotal = 0) {
  const shippingConfig = await this.findOne({ isActive: true });
  
  if (!shippingConfig) {
    throw new Error('No active shipping configuration found');
  }
  
  // Initialize variables
  let shippingPrice = shippingConfig.defaultPrice;
  let deliveryDays = shippingConfig.defaultDeliveryDays; // Start with global default
  let method = 'Standard Delivery';
  let applicableFreeThreshold = shippingConfig.freeShippingThreshold;
  
  // Check city-level pricing first
  if (location.city && location.state) {
    const cityPrice = shippingConfig.cityPrices.find(
      cp => cp.state === location.state &&
            cp.city === location.city
    );
    
    if (cityPrice) {
      shippingPrice = cityPrice.price;
      applicableFreeThreshold = cityPrice.freeShippingThreshold || applicableFreeThreshold;
      
      // Use city-level delivery days if available
      if (cityPrice.deliveryDays) {
        deliveryDays = cityPrice.deliveryDays;
      }
    }
  }
  
  // Check state-level pricing if no city price found
  if (location.state && shippingPrice === shippingConfig.defaultPrice) {
    const statePrice = shippingConfig.statePrices.find(
      sp => sp.state === location.state
    );
    
    if (statePrice) {
      shippingPrice = statePrice.price;
      applicableFreeThreshold = statePrice.freeShippingThreshold || applicableFreeThreshold;
      
      // Use state-level delivery days if available (and city didn't set it)
      if (statePrice.deliveryDays && deliveryDays === shippingConfig.defaultDeliveryDays) {
        deliveryDays = statePrice.deliveryDays;
      }
    }
  }
  
  // Check for free shipping
  const isFreeShipping = orderTotal >= applicableFreeThreshold;
  
  return { 
    price: isFreeShipping ? 0 : shippingPrice,
    method: isFreeShipping ? 'Standard Delivery (Free)' : method,
    isFree: isFreeShipping,
    deliveryDays, // Return calculated delivery days
    currency: 'NGN'
  };
};

const Shipping = mongoose.models?.Shipping || mongoose.model('Shipping', nigeriaShippingSchema);

module.exports = Shipping;
const { states } = require("@/data/states")
const mongoose = require("mongoose")

const nigeriaShippingSchema = new mongoose.Schema(
  {
    defaultPrice: {
      type: Number,
      required: [true, "Default shipping price is required"],
      min: [0, "Shipping price cannot be negative"],
      default: 1500,
    },

    defaultDeliveryDays: {
      type: String,
      required: [true, "Default delivery days are required"],
      validate: {
        validator: function(v) {
          // More flexible validation - allows "1-6", "3-4", "5", "7-10 days", etc.
          return /^(\d+-\d+|\d+)(\s+days?)?$/.test(v);
        },
        message: "Delivery days must be in format like '1-10', '3-4', or '5 days'"
      },
      default: "2-3 days",
    },

    freeShippingThreshold: {
      type: Number,
      min: [300000, "Free shipping threshold cannot be negative"],
    },

    statePrices: [
      {
        state: {
          type: String,
          required: [true, "State name is required"],
          enum: states.map((s) => s.state),
        },
        price: {
          type: Number,
          required: [true, "Shipping price is required"],
          min: [0, "Shipping price cannot be negative"],
        },
        deliveryDays: {
          type: String,
          validate: {
            validator: function(v) {
              if (!v) return true; // Optional field
              // More flexible validation
              return /^(\d+-\d+|\d+)(\s+days?)?$/.test(v);
            },
            message: "Delivery days must be in format like '1-6', '3-4', or '5 days'"
          },
        },
        freeShippingThreshold: {
          type: Number,
          min: [0, "Free shipping threshold cannot be negative"],
        },
      },
    ],

    cityPrices: [
      {
        state: {
          type: String,
          required: [true, "State name is required"],
          enum: states.map((s) => s.state),
        },
        city: {
          type: String,
          required: [true, "City name is required"],
          validate: {
            validator: function (city) {
              const state = states.find((s) => s.state === this.state)
              return state ? state.lgas.includes(city) : false
            },
            message: (props) => `${props.value} is not a valid city for the selected state"`,
          },
        },
        price: {
          type: Number,
          required: [true, "Shipping price is required"],
          min: [0, "Shipping price cannot be negative"],
        },
        deliveryDays: {
          type: String,
          validate: {
            validator: function(v) {
              if (!v) return true; // Optional field
              // More flexible validation
              return /^(\d+-\d+|\d+)(\s+days?)?$/.test(v);
            },
            message: "Delivery days must be in format like '1-6', '3-4', or '5 days'"
          },
        },
        freeShippingThreshold: {
          type: Number,
          min: [0, "Free shipping threshold cannot be negative"],
        },
      },
    ],

    isActive: {
      type: Boolean,
      default: true,
    },

    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

// ... rest of the schema remains the same ...

nigeriaShippingSchema.index({ "statePrices.state": 1 })
nigeriaShippingSchema.index({ "cityPrices.state": 1, "cityPrices.city": 1 })

nigeriaShippingSchema.statics.calculateNigeriaShipping = async function (location, orderTotal = 0) {
  const shippingConfig = await this.findOne({ isActive: true })
  if (!shippingConfig) throw new Error("No active shipping configuration found")

  let shippingPrice = shippingConfig.defaultPrice
  let deliveryDays = shippingConfig.defaultDeliveryDays
  const method = "Standard Delivery"
  let applicableFreeThreshold = shippingConfig.freeShippingThreshold

  // City-level first
  const cityPrice = location.city && location.state
    ? shippingConfig.cityPrices.find(
        cp =>
          cp.state.toLowerCase() === location.state.toLowerCase() &&
          cp.city.toLowerCase() === location.city.toLowerCase()
      )
    : null

  if (cityPrice) {
    shippingPrice = cityPrice.price
    if (cityPrice.freeShippingThreshold !== undefined && cityPrice.freeShippingThreshold !== null) {
      applicableFreeThreshold = cityPrice.freeShippingThreshold
    }
    if (cityPrice.deliveryDays) deliveryDays = cityPrice.deliveryDays
  } else {
    // State-level if no city match
    const statePrice = location.state
      ? shippingConfig.statePrices.find(
          sp => sp.state.toLowerCase() === location.state.toLowerCase()
        )
      : null

    if (statePrice) {
      shippingPrice = statePrice.price
      if (statePrice.freeShippingThreshold !== undefined && statePrice.freeShippingThreshold !== null) {
        applicableFreeThreshold = statePrice.freeShippingThreshold
      }
      if (statePrice.deliveryDays) deliveryDays = statePrice.deliveryDays
    }
  }

  // Check if free shipping applies
  const isFreeShipping = applicableFreeThreshold !== undefined && 
                         applicableFreeThreshold !== null && 
                         orderTotal >= applicableFreeThreshold

  return {
    price: isFreeShipping ? 0 : shippingPrice,
    method: isFreeShipping ? "Standard Delivery (Free)" : method,
    isFree: isFreeShipping,
    deliveryDays,
    formattedDeliveryDays: deliveryDays.includes('days') ? deliveryDays : `${deliveryDays} days`,
    currency: "NGN",
  }
}

const Shipping = mongoose.models?.Shipping || mongoose.model("Shipping", nigeriaShippingSchema)

module.exports = Shipping
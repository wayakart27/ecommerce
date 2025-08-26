const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProductSchema = new Schema(
  {
    productId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: () => `PRD-${Math.floor(100000 + Math.random() * 900000)}`
    },
    slug: {
      type: String,
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v) {
          return /^[a-z0-9\-]+$/.test(v);
        },
        message: 'Slug can only contain lowercase letters, numbers, and hyphens'
      }
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [100, 'Product name cannot exceed 100 characters'],
      index: true
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0.01, 'Price must be greater than zero'],
      set: v => parseFloat(v.toFixed(2))
    },
    purchasePrice: {
      type: Number,
      required: [true, 'Purchase price is required'],
      min: [0.01, 'Purchase price must be greater than zero'],
      set: v => parseFloat(v.toFixed(2)),
    },
    discountedPrice: {
      type: Number,
      min: [0, 'Discounted price cannot be negative'],
      set: v => v === null ? null : parseFloat(v.toFixed(2)),
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Product category is required'],
      validate: {
        validator: async function (v) {
          if (!mongoose.Types.ObjectId.isValid(v)) return false;
          const category = await mongoose.model('Category').findById(v);
          return !!category;
        },
        message: 'Invalid category reference'
      }
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, 'Stock cannot be negative'],
      set: v => Math.floor(v)
    },
    images: {
      type: [String], // Array of Cloudinary URLs
      default: [],
      validate: {
        validator: function(v) {
          return v.length <= 5;
        },
        message: 'Cannot have more than 5 images'
      }
    },
    defaultImage: {
      type: String // Cloudinary URL for default image
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    features: {
      type: [{
        type: String,
        trim: true,
        maxlength: [50, 'Feature cannot exceed 50 characters']
      }],
      default: [],
      validate: {
        validator: v => v.length <= 20,
        message: 'Cannot have more than 20 features'
      }
    },
    tags: {
      type: [String],
      default: [],
      index: true,
      validate: {
        validator: v => v.length <= 10,
        message: 'Cannot have more than 10 tags'
      }
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret.__v;
        delete ret._id;
        return ret;
      }
    },
    toObject: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret.__v;
        delete ret._id;
        return ret;
      }
    }
  }
);

// Virtual for discount percentage
ProductSchema.virtual('discountPercentage').get(function () {
  if (!this.price || !this.discountedPrice) return 0;
  return Math.round(((this.price - this.discountedPrice) / this.price) * 100);
});

// Slug generation middleware
ProductSchema.pre('save', async function (next) {
  try {

    // Ensure purchasePrice is not higher than price
    if (this.purchasePrice > this.price) {
      return next(new Error('Purchase price cannot be greater than selling price'));
    }

    // Ensure discountedPrice is not higher than price
    if (this.discountedPrice && this.discountedPrice > this.price) {
      return next(new Error('Discounted price cannot be greater than regular price'));
    }

    // Set default image if none specified but images exist
    if (this.images.length > 0 && !this.defaultImage) {
      this.defaultImage = this.images[0];
    }


    next();
  } catch (err) {
    next(err);
  }
});

ProductSchema.index({ name: 'text', description: 'text', features: 'text' });
ProductSchema.index({ category: 1, isActive: 1, price: 1 });
ProductSchema.index({ price: 1, discountedPrice: 1 });
ProductSchema.index({ stock: 1, isActive: 1 });
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ updatedAt: -1 });

// Query helpers
ProductSchema.query.active = function () {
  return this.where({ isActive: true });
};

ProductSchema.query.bySlug = function (slug) {
  return this.where({ slug });
};

ProductSchema.query.inStock = function () {
  return this.where({ stock: { $gt: 0 } });
};

ProductSchema.query.withImages = function () {
  return this.where('images').exists(true).ne([]);
};

// Static methods
ProductSchema.statics.findByPriceRange = function (min, max) {
  return this.find({
    price: { $gte: min, $lte: max },
    isActive: true
  });
};


module.exports = mongoose.models.Product || mongoose.model('Product', ProductSchema);
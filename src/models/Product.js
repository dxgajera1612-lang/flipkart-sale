// models/Product.js
import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  title2: {
    type: String,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  features: {
    type: String,
    default: '',
  },
  color: {
    type: String,
    default: '',
  },
  size: {
    type: String,
    default: '',
  },
  storage: {
    type: String,
    default: '',
  },
  mrp: {
    type: Number,
    required: true,
    min: 0,
  },
  sellingPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  images: [{
    type: String,
  }],
  mainImage: {
    type: String,
    default: '',
  },
  category: {
    type: String,
    default: 'General',
    index: true,
  },
  subCategory: {
    type: String,
    default: '',
  },
  brand: {
    type: String,
    default: '',
  },
  sku: {
    type: String,
    sparse: true,
  },
  stock: {
    type: Number,
    default: 0,
    min: 0,
  },
  variants: [{
    size: String,
    color: String,
    storage: String,
    price: Number,
    stock: Number,
    sku: String,
  }],
  displayOrder: {
    type: Number,
    default: 0,
    index: true,
  },
  // ✅ sortOrder is the main field for custom ordering
  sortOrder: {
    type: Number,
    default: 0,
    index: true, // ✅ Indexed for fast sorting
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  isFeatured: {
    type: Boolean,
    default: false,
    index: true,
  },
  tags: [{
    type: String,
  }],
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  reviewCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  soldCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  viewCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  metaTitle: {
    type: String,
    default: '',
  },
  metaDescription: {
    type: String,
    default: '',
  },
  slug: {
    type: String,
    sparse: true,
    index: true,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (this.mrp && this.sellingPrice) {
    return Math.round(((this.mrp - this.sellingPrice) / this.mrp) * 100);
  }
  return 0;
});

// ✅ Compound index for common queries
productSchema.index({ isActive: 1, sortOrder: 1 });
productSchema.index({ category: 1, sortOrder: 1 });
productSchema.index({ isFeatured: 1, sortOrder: 1 });

// Index for search
productSchema.index({ title: 'text', description: 'text', features: 'text' });

// Pre-save hook to generate slug
productSchema.pre('save', function(next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  
  // Auto-calculate discount if not set
  if (this.mrp && this.sellingPrice && !this.discount) {
    this.discount = Math.round(((this.mrp - this.sellingPrice) / this.mrp) * 100);
  }
  
  next();
});

// ✅ Static method to get next sort order
productSchema.statics.getNextSortOrder = async function() {
  const lastProduct = await this.findOne().sort({ sortOrder: -1 }).select('sortOrder');
  return lastProduct ? (lastProduct.sortOrder || 0) + 1 : 0;
};

export default mongoose.models.Product || mongoose.model('Product', productSchema);
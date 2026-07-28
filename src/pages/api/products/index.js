// pages/api/products/index.js
import connectToDatabase from '../../../utils/mongodb';
import Product from '../../../models/Product';
import { withAdminAuth } from '../../../middleware/auth';

async function handler(req, res) {
  await connectToDatabase();

  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        return await handleGet(req, res);

      case 'POST':
        // Protect POST with admin auth
        return withAdminAuth(handlePost)(req, res);

      default:
        return res.status(405).json({
          success: false,
          message: 'Method not allowed',
        });
    }
  } catch (error) {
    console.error('Products API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}

async function handleGet(req, res) {
  const {
    page = 1,
    limit = 20,
    search = '',
    category = '',
    sortBy = 'sortOrder',
    order = 'asc',
    isActive,
    isFeatured,
  } = req.query;

  const query = {};

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { category: { $regex: search, $options: 'i' } },
      { brand: { $regex: search, $options: 'i' } },
    ];
  }

  if (category) {
    query.category = category;
  }

  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }

  if (isFeatured !== undefined) {
    query.isFeatured = isFeatured === 'true';
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;
  const sortOrder = order === 'asc' ? 1 : -1;

  const sortObj = {};
  sortObj[sortBy] = sortOrder;

  const [products, total] = await Promise.all([
    Product.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Product.countDocuments(query),
  ]);

  const totalPages = Math.ceil(total / limitNum);

  return res.status(200).json({
    success: true,
    data: products,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages,
      hasNext: pageNum < totalPages, // ✅ THIS was missing — fixes infinite scroll
    },
  });
}

async function handlePost(req, res) {
  const {
    title,
    title2,
    description,
    features,
    color,
    size,
    storage,
    mrp,
    sellingPrice,
    images,
    mainImage,
    category,
    subCategory,
    brand,
    sku,
    stock,
    variants,
    displayOrder,
    isActive,
    isFeatured,
    tags,
  } = req.body;

  if (!title || !mrp || !sellingPrice) {
    return res.status(400).json({
      success: false,
      message: 'Title, MRP, and selling price are required',
    });
  }

  if (sellingPrice > mrp) {
    return res.status(400).json({
      success: false,
      message: 'Selling price cannot be greater than MRP',
    });
  }

  const lastProduct = await Product.findOne().sort({ sortOrder: -1 }).select('sortOrder');
  const nextSortOrder = lastProduct ? (lastProduct.sortOrder || 0) + 1 : 0;

  const product = new Product({
    title,
    title2: title2 || title,
    description,
    features,
    color,
    size,
    storage,
    mrp: parseFloat(mrp),
    sellingPrice: parseFloat(sellingPrice),
    images: images || [],
    mainImage: mainImage || (images && images[0]) || '',
    category,
    subCategory,
    brand,
    sku,
    stock: stock || 0,
    variants: variants || [],
    displayOrder: displayOrder || 0,
    sortOrder: nextSortOrder,
    isActive: isActive !== false,
    isFeatured: isFeatured || false,
    tags: tags || [],
  });

  const savedProduct = await product.save();

  return res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: savedProduct,
  });
}

export default handler;
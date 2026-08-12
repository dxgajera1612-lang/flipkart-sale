// pages/api/products/[id].js
import connectToDatabase from '../../../utils/mongodb';
import Product from '../../../models/Product';
import { withAdminAuth } from '../../../middleware/auth';

async function handler(req, res) {
  // ✅ Await database connection
  await connectToDatabase();

  const { method } = req;
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: 'Product ID is required',
    });
  }

  try {
    switch (method) {
      case 'GET':
        return await handleGet(req, res, id);
      
      case 'PUT':
        return withAdminAuth(handlePut)(req, res);
      
      case 'DELETE':
        return withAdminAuth(handleDelete)(req, res);
      
      default:
        return res.status(405).json({
          success: false,
          message: 'Method not allowed',
        });
    }
  } catch (error) {
    console.error('Product API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}

async function handleGet(req, res, id) {
  const product = await Product.findById(id);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found',
    });
  }

  // Increment view count
  await Product.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });

  return res.status(200).json({
    success: true,
    data: product,
  });
}

async function handlePut(req, res) {
  const { id } = req.query;
  const updateData = req.body;

  // Validation
  if (updateData.sellingPrice && updateData.mrp && updateData.sellingPrice > updateData.mrp) {
    return res.status(400).json({
      success: false,
      message: 'Selling price cannot be greater than MRP',
    });
  }

  const product = await Product.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found',
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Product updated successfully',
    data: product,
  });
}

async function handleDelete(req, res) {
  const { id } = req.query;

  const product = await Product.findByIdAndDelete(id);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found',
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Product deleted successfully',
  });
}

export default handler;
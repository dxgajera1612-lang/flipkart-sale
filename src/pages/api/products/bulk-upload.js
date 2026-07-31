// pages/api/products/bulk-upload.js
import connectToDatabase from '../../../utils/mongodb';
import Product from '../../../models/Product';
import { withAdminAuth } from '../../../middleware/auth';
import { validateProductCSV, formatProductFromCSV } from '../../../utils/csvHelper';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

/**
 * Generate slug from product name
 */
function generateSlug(name, sku) {
  let base = (name || 'product')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  if (base.length > 150) {
    base = base.substring(0, 150).replace(/-[^-]*$/, '');
  }

  const suffix = sku 
    ? sku.toLowerCase().replace(/[^a-z0-9]/g, '') 
    : Math.random().toString(36).substring(2, 8);

  return `${base}-${suffix}`;
}

/**
 * Bulk upload handler
 */
async function handler(req, res) {
  // ✅ Await database connection
  await connectToDatabase();

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }

  try {
    const { csvData, mode = 'skip', batchSize = 50 } = req.body;

    // Validate input
    if (!csvData || !Array.isArray(csvData)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid CSV data format',
      });
    }

    if (csvData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'CSV data is empty',
      });
    }

    console.log(`Starting bulk upload: ${csvData.length} products in ${mode} mode`);

    // Validate
    const validation = validateProductCSV(csvData);
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'CSV validation failed',
        errors: validation.errors,
        warnings: validation.warnings,
      });
    }

    const results = {
      total: csvData.length,
      created: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      errors: [],
      warnings: validation.warnings || [],
      processedProducts: [],
    };

    // Process in batches
    const batches = [];
    for (let i = 0; i < csvData.length; i += batchSize) {
      batches.push(csvData.slice(i, i + batchSize));
    }

    console.log(`Processing ${batches.length} batches`);

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      console.log(`Batch ${batchIndex + 1}/${batches.length}`);
      
      const batchResults = await processBatch(batch, mode, batchIndex * batchSize);
      
      results.created += batchResults.created;
      results.updated += batchResults.updated;
      results.skipped += batchResults.skipped;
      results.failed += batchResults.failed;
      results.errors.push(...batchResults.errors);
      results.processedProducts.push(...batchResults.processedProducts);
    }

    const statusCode = results.failed > 0 ? 207 : 200;

    console.log('Bulk upload completed:', {
      created: results.created,
      updated: results.updated,
      skipped: results.skipped,
      failed: results.failed,
    });

    return res.status(statusCode).json({
      success: results.failed < results.total,
      message: generateSummaryMessage(results),
      data: results,
    });

  } catch (error) {
    console.error('Bulk upload error:', error);
    return res.status(500).json({
      success: false,
      message: 'Upload failed: ' + error.message,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}

/**
 * Process batch
 */
async function processBatch(batch, mode, offset) {
  const results = {
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    errors: [],
    processedProducts: [],
  };

  // Format products
  const formattedProducts = batch.map((row, index) => {
    const data = formatProductFromCSV(row);
    data.slug = generateSlug(data.title, data.sku);
    
    return {
      row: offset + index + 2,
      data,
    };
  });

  // Get existing SKUs
  const skus = formattedProducts.map(p => p.data.sku).filter(Boolean);
  const slugs = formattedProducts.map(p => p.data.slug).filter(Boolean);

  const existingProducts = await Product.find({
    $or: [
      { sku: { $in: skus } },
      { slug: { $in: slugs } },
    ],
  }).select('_id sku slug title createdAt');

  const existingBySku = new Map(
    existingProducts.filter(p => p.sku).map(p => [p.sku, p])
  );
  const existingBySlug = new Map(
    existingProducts.filter(p => p.slug).map(p => [p.slug, p])
  );

  // Get highest sortOrder
  const lastProduct = await Product.findOne().sort({ sortOrder: -1 }).select('sortOrder displayOrder');
  let nextOrder = lastProduct ? Math.max(lastProduct.sortOrder || 0, lastProduct.displayOrder || 0) + 1 : 0;

  // Process each product
  for (const { row, data } of formattedProducts) {
    try {
      let existing = existingBySku.get(data.sku) || existingBySlug.get(data.slug);

      if (existing) {
        if (mode === 'skip') {
          results.skipped++;
          results.errors.push({
            row,
            title: data.title,
            sku: data.sku,
            type: 'info',
            message: 'Product exists (skipped)',
          });
        } else if (mode === 'update' || mode === 'replace') {
          const updateData = mode === 'replace' ? data : {
            ...data,
            createdAt: existing.createdAt,
          };

          await Product.findByIdAndUpdate(
            existing._id,
            { ...updateData, updatedAt: new Date() },
            { new: true, runValidators: true }
          );

          results.updated++;
          results.processedProducts.push({
            action: 'updated',
            title: data.title,
            sku: data.sku,
          });
          
          console.log(`Updated: ${data.title}`);
        }
      } else {
        data.sortOrder = nextOrder;
        data.displayOrder = nextOrder;
        nextOrder++;

        const product = new Product(data);
        await product.save();
        
        results.created++;
        results.processedProducts.push({
          action: 'created',
          title: data.title,
          sku: data.sku,
        });
        
        console.log(`Created: ${data.title}`);
      }
    } catch (error) {
      results.failed++;
      
      let errorMessage = error.message;
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern || {})[0];
        errorMessage = `Duplicate ${field}`;
      }
      
      results.errors.push({
        row,
        title: data.title,
        sku: data.sku,
        type: 'error',
        message: errorMessage,
      });
      
      console.error(`Failed row ${row}:`, errorMessage);
    }
  }

  return results;
}

/**
 * Generate summary
 */
function generateSummaryMessage(results) {
  const parts = [];
  
  if (results.created > 0) parts.push(`${results.created} created`);
  if (results.updated > 0) parts.push(`${results.updated} updated`);
  if (results.skipped > 0) parts.push(`${results.skipped} skipped`);
  if (results.failed > 0) parts.push(`${results.failed} failed`);

  return parts.length > 0 
    ? `Bulk upload completed: ${parts.join(', ')}`
    : 'No products processed';
}

export default withAdminAuth(handler);
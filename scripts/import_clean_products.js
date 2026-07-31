const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

async function main() {
  let MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    ['.env.local', '.env'].forEach(file => {
      try {
        const envFile = fs.readFileSync(path.join(process.cwd(), file), 'utf8');
        const matchUri = envFile.match(/MONGODB_URI\s*=\s*(.*)/);
        if (matchUri && matchUri[1]) MONGODB_URI = matchUri[1].trim().replace(/^["']|["']$/g, '');
      } catch(e) {}
    });
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB successfully!");

  const rawProducts = JSON.parse(fs.readFileSync('clean_products.json', 'utf8'));
  console.log(`Loaded ${rawProducts.length} clean products from clean_products.json`);

  const productSchema = new mongoose.Schema({}, { strict: false });
  const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

  // 1. Delete all existing products
  const deleteResult = await Product.deleteMany({});
  console.log(`🗑️ Deleted ${deleteResult.deletedCount} old products from MongoDB.`);

  // 2. Format documents for insertion
  const documentsToInsert = rawProducts.map((item, idx) => {
    const imagesList = [];
    ['images', 'images1', 'images2', 'images3', 'images4'].forEach(key => {
      if (item[key] && typeof item[key] === 'string' && item[key].trim() && item[key] !== 'NULL') {
        const trimmed = item[key].trim();
        if (!imagesList.includes(trimmed)) imagesList.push(trimmed);
      }
    });

    const rawTitle = (item.Title || item.title || `Product ${idx + 1}`).trim();
    const title = rawTitle.replace(/\s+/g, ' ');
    const mrp = parseFloat(item.mrp) || 0;
    const sellingPrice = parseFloat(item.selling_price) || 0;
    const discount = mrp > 0 && mrp > sellingPrice ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0;
    
    // Clean features HTML: replace artifact L_id -> Lid, w_idth -> width, etc.
    const rawFeatures = item.fetaures || item.features || '';
    const cleanFeatures = typeof rawFeatures === 'string' 
      ? rawFeatures.replace(/L_id/g, 'Lid').replace(/w_idth/g, 'width').replace(/cel_w_idget/g, 'cel_widget').replace(/celw_idget/g, 'cel_widget')
      : '';

    return {
      customId: String(item._id || idx + 1),
      title: title,
      title2: title,
      description: cleanFeatures,
      features: cleanFeatures,
      color: item.color || 'default',
      size: item.size || 'default',
      storage: item.storage || '',
      mrp: mrp,
      sellingPrice: sellingPrice,
      discount: discount,
      images: imagesList,
      mainImage: imagesList[0] || '',
      category: 'Home & Kitchen',
      subCategory: 'Kitchen Appliances',
      brand: 'Prestige',
      stock: 100,
      sortOrder: idx + 1,
      displayOrder: parseInt(item.disp_order) || idx + 1,
      isActive: true,
      fromCsv: item.from_csv || "1",
      variants: (item.verients || []).map(v => ({
        color: v.color || 'default',
        size: v.size || 'default',
        storage: v.storage || '',
        price: parseFloat(v.selling_price) || sellingPrice,
        stock: 100
      }))
    };
  });

  // 3. Insert new products
  const inserted = await Product.insertMany(documentsToInsert);
  console.log(`✅ Successfully inserted ${inserted.length} new products into MongoDB!`);

  // 4. Generate CSV File for upload/export matching website format
  const csvHeaders = ['_id', 'Title', 'color', 'size', 'storage', 'selling_price', 'mrp', 'fetaures', 'images', 'images1', 'images2', 'images3', 'images4', 'disp_order', 'from_csv'];
  
  const csvRows = [csvHeaders.join(',')];
  for (const item of rawProducts) {
    const row = csvHeaders.map(header => {
      let val = item[header] !== undefined && item[header] !== null ? item[header] : '';
      if (typeof val === 'object') val = JSON.stringify(val);
      val = String(val).replace(/"/g, '""');
      return `"${val}"`;
    });
    csvRows.push(row.join(','));
  }

  const csvContent = csvRows.join('\n');
  const csvPath = path.join(process.cwd(), 'public', 'products_import.csv');
  fs.writeFileSync(csvPath, csvContent, 'utf8');
  console.log(`📄 Generated web CSV format file at: ${csvPath}`);

  await mongoose.disconnect();
  console.log("🚀 All operations completed cleanly!");
}

main().catch(err => {
  console.error("❌ Script Error:", err);
  process.exit(1);
});

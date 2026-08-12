const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const transcriptPath = `C:\\Users\\ASUS\\.gemini\\antigravity\\brain\\3afcb586-3acd-4788-aa59-b0ac978bf43f\\.system_generated\\logs\\transcript_full.jsonl`;

async function main() {
  const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n').filter(Boolean);
  let content = '';
  for (let i = lines.length - 1; i >= 0; i--) {
    try {
      const parsed = JSON.parse(lines[i]);
      if (parsed.type === 'USER_INPUT' && parsed.content) {
        content = parsed.content;
        break;
      }
    } catch (e) {}
  }
  
  if (!content) {
    console.error("Could not find USER_INPUT line in transcript!");
    process.exit(1);
  }

  const match = content.match(/\[\s*\{[\s\S]*\}\s*\]/);
  if (!match) {
    console.error("Could not find JSON array in user request!");
    process.exit(1);
  }

  const rawJsonStr = match[0];
  let rawProducts;
  try {
    rawProducts = JSON.parse(rawJsonStr);
  } catch (e) {
    // Fallback to JS Function evaluation for unescaped HTML/quote characters in string literals
    rawProducts = new Function(`return ${rawJsonStr}`)();
  }
  console.log(`Extracted ${rawProducts.length} products from user prompt!`);

  const dotenv = require('dotenv');
  dotenv.config({ path: '.env.local' });
  let MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    try {
      const envFile = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8');
      const matchUri = envFile.match(/MONGODB_URI\s*=\s*(.*)/);
      if (matchUri) MONGODB_URI = matchUri[1].trim().replace(/^["']|["']$/g, '');
    } catch(e) {}
  }

  if (!MONGODB_URI) {
    MONGODB_URI = "mongodb://localhost:27017/meesho";
  }

  console.log(`Connecting to MongoDB...`);
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  const productSchema = new mongoose.Schema({}, { strict: false });
  const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

  const deleteResult = await Product.deleteMany({});
  console.log(`Deleted ${deleteResult.deletedCount} existing products.`);

  const documentsToInsert = rawProducts.map((item, idx) => {
    const imagesList = [];
    ['images', 'images1', 'images2', 'images3', 'images4'].forEach(key => {
      if (item[key] && item[key].trim() && item[key] !== 'NULL') {
        imagesList.push(item[key].trim());
      }
    });

    const rawTitle = (item.Title || item.title || 'Untitled Product').trim();
    const title = rawTitle.replace(/\s+/g, ' ');
    const mrp = parseFloat(item.mrp) || 0;
    const sellingPrice = parseFloat(item.selling_price) || 0;
    const discount = mrp > 0 && mrp > sellingPrice ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0;
    const cleanFeatures = (item.fetaures || item.features || '').replace(/L_id/g, 'Lid').replace(/w_idth/g, 'width').replace(/_id/g, 'id');

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
      displayOrder: item.disp_order || idx + 1,
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

  const inserted = await Product.insertMany(documentsToInsert);
  console.log(`Successfully inserted ${inserted.length} new products into MongoDB!`);

  const csvHeaders = ['_id', 'Title', 'color', 'size', 'storage', 'selling_price', 'mrp', 'fetaures', 'images', 'images1', 'images2', 'images3', 'images4', 'disp_order', 'from_csv'];
  
  const csvRows = [csvHeaders.join(',')];
  for (const item of rawProducts) {
    const row = csvHeaders.map(header => {
      let val = item[header] !== undefined ? item[header] : '';
      if (typeof val === 'object') val = JSON.stringify(val);
      val = String(val).replace(/"/g, '""');
      return `"${val}"`;
    });
    csvRows.push(row.join(','));
  }

  const csvContent = csvRows.join('\n');
  const csvPath = path.join(process.cwd(), 'public', 'products_import.csv');
  fs.writeFileSync(csvPath, csvContent, 'utf8');
  console.log(`Generated CSV file: ${csvPath}`);

  await mongoose.disconnect();
  console.log("Disconnected from MongoDB. Task Completed Successfully!");
}

main().catch(err => {
  console.error("Error executing script:", err);
  process.exit(1);
});

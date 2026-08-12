const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: '.env' });

const product11 = {
  "_id": "11",
  "Title": "Juicer, 600W Juicer Machine with 3.5 Inch Wide Chute for Whole Fruits, High Yield Juice Extractor with 3 Speeds",
  "color": "default",
  "size": "default",
  "storage": "",
  "selling_price": "450",
  "mrp": "6399",
  "fetaures": `<div id="feature-bullets" class="a-section a-spacing-medium a-spacing-top-small"><h1 class="a-size-base-plus a-text-bold">About this item</h1><ul class="a-unordered-list a-vertical a-spacing-mini"><li class="a-spacing-mini"><span class="a-list-item">🍊 600W High-speed Power: Juicer provides up to 600W of power, and the high-speed motor can make fruit and vegetable juice within 5 seconds.</span></li><li class="a-spacing-mini"><span class="a-list-item">🍏 3 Speeds: Choose appropriate speed according to food softness. "I" low speed: 12000-18000 rpm; "II" high speed: 18000-27000 rpm.</span></li><li class="a-spacing-mini"><span class="a-list-item">🍓 High Juice Yield: 304 stainless steel filter & multi-head blade ensures 30% higher juice yield.</span></li><li class="a-spacing-mini"><span class="a-list-item">🍍 3.5-inch Large Food Chute: Reduces prep time; small apples go right in without dicing.</span></li><li class="a-spacing-mini"><span class="a-list-item">🍉 Easy to Clean: Dishwasher safe removable parts.</span></li></ul></div>`,
  "images": "https://m.media-amazon.com/images/I/81Wr7b2O0gL._AC_SL1500_.jpg",
  "images1": "https://m.media-amazon.com/images/I/71lK5nphY+L._AC_SL1500_.jpg",
  "images2": "https://m.media-amazon.com/images/I/71ShyEqZd7L._AC_SL1500_.jpg",
  "images3": "https://m.media-amazon.com/images/I/61bUGr71puL._AC_SL1500_.jpg",
  "images4": "",
  "disp_order": 0,
  "from_csv": "1",
  "created_at": "0000-00-00 00:00:00",
  "verients": [
    {
      "_id": "11",
      "product__id": "11",
      "Title": "Juicer, 600W Juicer Machine with 3.5 Inch Wide Chute for Whole Fruits, High Yield Juice Extractor with 3 Speeds",
      "color": "default",
      "size": "default",
      "storage": "",
      "selling_price": "450",
      "mrp": "6399"
    }
  ]
};

let products = JSON.parse(fs.readFileSync('clean_products.json', 'utf8'));

if (!products.some(p => p._id === "11")) {
  products.push(product11);
  console.log("Appended Product 11 to products list!");
}

fs.writeFileSync('clean_products.json', JSON.stringify(products, null, 2));

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
  console.log("Connected to MongoDB!");

  const productSchema = new mongoose.Schema({}, { strict: false });
  const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

  // Clear products table
  await Product.deleteMany({});
  console.log("Cleared existing products table.");

  // Map 11 products into DB documents
  const docs = products.map((item, idx) => {
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

  const inserted = await Product.insertMany(docs);
  console.log(`✅ Successfully inserted ALL ${inserted.length} products into MongoDB!`);

  // Generate web CSV
  const csvHeaders = ['_id', 'Title', 'color', 'size', 'storage', 'selling_price', 'mrp', 'fetaures', 'images', 'images1', 'images2', 'images3', 'images4', 'disp_order', 'from_csv'];
  const csvRows = [csvHeaders.join(',')];
  for (const item of products) {
    const row = csvHeaders.map(header => {
      let val = item[header] !== undefined && item[header] !== null ? item[header] : '';
      if (typeof val === 'object') val = JSON.stringify(val);
      val = String(val).replace(/"/g, '""');
      return `"${val}"`;
    });
    csvRows.push(row.join(','));
  }

  const csvPath = path.join(process.cwd(), 'public', 'products_import.csv');
  fs.writeFileSync(csvPath, csvRows.join('\n'), 'utf8');
  console.log(`📄 Updated public/products_import.csv with all ${products.length} products!`);

  await mongoose.disconnect();
  console.log("🎉 Reimport completed!");
}

main().catch(err => {
  console.error("❌ Error:", err);
  process.exit(1);
});

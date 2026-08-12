/* Replace the catalogue with products from the supplied Vercel CSV export. */
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Papa = require('papaparse');

const csvPath = path.resolve(process.argv[2] || 'public/vercel-sample.csv');
const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://v4x123:v4x123@cluster0.i3hnzcs.mongodb.net/www3';

function plainText(value = '') {
  return String(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

async function seed() {
  const csv = fs.readFileSync(csvPath, 'utf8');
  const { data, errors } = Papa.parse(csv, { header: true, skipEmptyLines: true });
  if (errors.length) throw new Error(`CSV could not be parsed: ${errors[0].message}`);
  if (!data.length) throw new Error('CSV has no product rows');

  const products = data.map((row, index) => {
    const images = [row.img1, row.img2, row.img3, row.img4, row.img5].filter(Boolean);
    const mrp = Number(row.mrp);
    const sellingPrice = Number(row.selling_price);
    return {
      title: row.name.trim(),
      title2: row.name.trim(),
      description: plainText(row.features) || row.name.trim(),
      features: row.features || '',
      color: row.color || 'Default',
      size: row.size || 'Default',
      storage: row.storage || '',
      mrp,
      sellingPrice,
      discount: mrp > sellingPrice ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0,
      images,
      mainImage: images[0] || '',
      category: 'Grocery & Essentials',
      brand: 'ShopKart',
      sku: `SB-${row.id || index + 1}`,
      stock: 100,
      variants: [{ color: row.color || 'Default', size: row.size || 'Default', storage: row.storage || '', price: sellingPrice, stock: 100, sku: `SB-${row.id || index + 1}` }],
      displayOrder: index + 1,
      sortOrder: index + 1,
      isActive: true,
      isFeatured: index < 8,
      tags: ['grocery', 'deal'],
      rating: 4.4,
      reviewCount: 7873,
      soldCount: 0,
      viewCount: 0,
      slug: `shopkart-${row.id || index + 1}`,
    };
  });

  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 15000 });
  const collection = mongoose.connection.collection('products');
  await collection.deleteMany({});
  await collection.insertMany(products);
  console.log(`Replaced catalogue with ${products.length} products from ${path.basename(csvPath)}.`);
  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error(error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});

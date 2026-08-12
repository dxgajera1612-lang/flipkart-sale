// utils/csvHelper.js
import Papa from 'papaparse';

/**
 * Parse CSV file with comprehensive error handling
 * @param {File} file - CSV file to parse
 * @returns {Promise<Array>} Parsed CSV data
 */
export const parseCSV = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('No file provided'));
    }

    // Check file type
    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'text/plain'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.csv')) {
      return reject(new Error('Invalid file type. Please upload a CSV file.'));
    }

    // Check file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return reject(new Error('File size exceeds 50MB limit'));
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (header) => {
        return header.trim().toLowerCase().replace(/\s+/g, '_');
      },
      transform: (value) => {
        if (!value) return '';
        return value.trim();
      },
      complete: (results) => {
        if (!results.data || results.data.length === 0) {
          return reject(new Error('CSV file is empty or invalid'));
        }

        // Filter out completely empty rows
        const validData = results.data.filter(row => {
          return Object.values(row).some(val => val && String(val).trim() !== '');
        });

        if (validData.length === 0) {
          return reject(new Error('No valid product rows found in CSV file'));
        }

        resolve(validData);
      },
      error: (error) => {
        reject(new Error(`CSV parsing error: ${error.message}`));
      },
    });
  });
};

/**
 * Validate product CSV data with flexible field checks
 * @param {Array} data - Parsed CSV data
 * @returns {Object} Validation result
 */
export const validateProductCSV = (data) => {
  const errors = [];
  const warnings = [];
  
  if (!data || !Array.isArray(data) || data.length === 0) {
    return {
      isValid: false,
      errors: ['No data found in CSV file'],
      warnings: [],
    };
  }

  // Flexible field name variations
  const nameFields = ['name', 'title', 'product_name', 'productname'];
  const priceFields = ['selling_price', 'sellingprice', 'sale_price', 'saleprice', 'price', 'mrp', 'original_price', 'originalprice'];

  const firstRow = data[0];
  const availableColumns = Object.keys(firstRow).map(k => k.toLowerCase());
  
  const hasNameColumn = nameFields.some(v => availableColumns.includes(v));
  const hasPriceColumn = priceFields.some(v => availableColumns.includes(v));

  if (!hasNameColumn) {
    errors.push(`Missing product title column (expected: 'name', 'title', or 'product_name')`);
  }

  if (!hasPriceColumn) {
    errors.push(`Missing price column (expected: 'selling_price', 'price', or 'mrp')`);
  }

  if (errors.length > 0) {
    return { isValid: false, errors, warnings, totalRows: data.length };
  }

  // Validate rows
  data.forEach((row, index) => {
    const rowNum = index + 2; // +2 for 1-based indexing + header row
    
    const name = getFieldValue(row, nameFields);
    const priceVal = getFieldValue(row, priceFields);

    if (!name || String(name).toLowerCase() === 'null') {
      errors.push(`Row ${rowNum}: Missing product title`);
    }

    if (!priceVal || isNaN(parseFloat(priceVal)) || parseFloat(priceVal) < 0) {
      errors.push(`Row ${rowNum}: Invalid price value "${priceVal}"`);
    }

    // Stock check
    const stock = getFieldValue(row, ['stock', 'quantity', 'qty']);
    if (stock && stock !== 'NULL' && stock !== '' && isNaN(parseInt(stock))) {
      warnings.push(`Row ${rowNum}: Stock value "${stock}" is non-numeric, will default to 0`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    totalRows: data.length,
  };
};

/**
 * Get field value from row with flexible naming
 */
const getFieldValue = (row, fieldNames) => {
  for (const name of fieldNames) {
    const key = Object.keys(row).find(k => k.toLowerCase() === name.toLowerCase());
    if (key && row[key] !== undefined && row[key] !== null) {
      return row[key];
    }
  }
  return null;
};

/**
 * Validate URL format
 */
const isValidURL = (url) => {
  if (!url || url === 'NULL' || url === '') return false;
  try {
    new URL(url);
    return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/');
  } catch {
    return false;
  }
};

/**
 * Clean text content
 */
const cleanTextContent = (text) => {
  if (!text || text === 'NULL') return '';
  let cleaned = String(text).trim();
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || 
      (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1);
  }
  return cleaned.replace(/\\n/g, '\n');
};

/**
 * Format product data from CSV row
 */
export const formatProductFromCSV = (row) => {
  const images = [];
  
  // 1. Collect individual image columns (img1..img10)
  for (let i = 1; i <= 10; i++) {
    const imgValue = getFieldValue(row, [`img${i}`, `image${i}`, `img_${i}`, `image_${i}`]);
    if (imgValue && imgValue !== 'NULL' && imgValue !== '' && isValidURL(imgValue)) {
      const trimmed = imgValue.trim();
      if (!images.includes(trimmed)) images.push(trimmed);
    }
  }
  
  // 2. Collect from main_image / image / images fields (supporting comma or newline separated URLs)
  const combinedImage = getFieldValue(row, ['main_image', 'mainimage', 'image', 'images', 'img', 'image_url', 'img_url']);
  if (combinedImage && combinedImage !== 'NULL' && combinedImage !== '') {
    const urls = String(combinedImage).split(/[\n,;]+/).map(s => s.trim()).filter(isValidURL);
    urls.forEach(u => {
      if (!images.includes(u)) images.push(u);
    });
  }

  // Title
  const name = getFieldValue(row, ['name', 'title', 'product_name', 'productname']) || 'Untitled Product';
  const title2 = getFieldValue(row, ['title_2', 'title2', 'full_name', 'fullname']) || name;
  
  // Prices
  let mrp = parseFloat(getFieldValue(row, ['mrp', 'original_price', 'originalprice', 'price']) || 0);
  let sellingPrice = parseFloat(getFieldValue(row, ['selling_price', 'sellingprice', 'sale_price', 'saleprice', 'price']) || 0);
  
  if (!sellingPrice && mrp) sellingPrice = mrp;
  if (!mrp && sellingPrice) mrp = sellingPrice;
  if (sellingPrice > mrp) mrp = sellingPrice;

  // Description & Features
  const description = cleanTextContent(getFieldValue(row, ['description', 'desc', 'product_description', 'details']));
  const features = cleanTextContent(getFieldValue(row, ['features', 'fetaures', 'feature', 'highlights']));
  
  // Category
  const category = getFieldValue(row, ['category', 'cat', 'category_name']) || 'General';
  const subCategory = getFieldValue(row, ['subcategory', 'sub_category', 'subcat']) || '';
  
  // Product Specs
  const color = getFieldValue(row, ['color', 'colour']) || '';
  const size = getFieldValue(row, ['size']) || '';
  const storage = getFieldValue(row, ['storage', 'capacity']) || '';
  
  // Meta
  const brand = getFieldValue(row, ['brand', 'manufacturer']) || '';
  const sku = getFieldValue(row, ['sku', 'product_id', 'unique_name']) || `SKU-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const stock = Math.max(0, parseInt(getFieldValue(row, ['stock', 'quantity', 'qty']) || 10));
  
  // Flags
  const isActiveValue = getFieldValue(row, ['is_active', 'isactive', 'active', 'is_show']);
  const isFeaturedValue = getFieldValue(row, ['is_featured', 'isfeatured', 'featured']);
  
  const isActive = isActiveValue !== null && isActiveValue !== undefined 
    ? ['true', '1', 'yes'].includes(String(isActiveValue).toLowerCase()) 
    : true;

  const isFeatured = isFeaturedValue !== null && isFeaturedValue !== undefined 
    ? ['true', '1', 'yes'].includes(String(isFeaturedValue).toLowerCase()) 
    : false;
  
  // Tags
  const tagsValue = getFieldValue(row, ['tags', 'keywords', 'labels']) || '';
  const tags = tagsValue ? String(tagsValue).split(',').map(tag => tag.trim()).filter(Boolean) : [];
  
  const discount = mrp > 0 ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0;
  const displayOrder = parseInt(getFieldValue(row, ['display_order', 'displayorder', 'order', 'index']) || 0);

  return {
    title: name,
    title2: title2 || name,
    description: description,
    features: features,
    color: color,
    size: size,
    storage: storage,
    mrp: mrp,
    sellingPrice: sellingPrice,
    discount: discount,
    mainImage: images[0] || '',
    images: images,
    category: category,
    subCategory: subCategory,
    brand: brand,
    sku: sku,
    stock: stock,
    displayOrder: displayOrder,
    isActive: isActive,
    isFeatured: isFeatured,
    tags: tags,
    rating: 0,
    reviewCount: 0,
    soldCount: 0,
    viewCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

/**
 * Generate CSV template string
 */
export const generateCSVTemplate = () => {
  const template = [
    {
      name: 'Sample Kitchenware Product',
      description: '<h3>Product Highlights</h3><p>High durability stainless steel construction.</p>',
      features: 'Food Grade Material, Gas & Induction Friendly',
      mrp: '1999',
      selling_price: '999',
      color: 'Silver',
      size: 'Standard',
      storage: '1.5L',
      img1: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff',
      img2: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f',
      img3: '',
      img4: '',
      img5: '',
      category: 'Kitchenware',
      subcategory: 'Cookware',
      brand: 'ChefMaster',
      sku: 'SKU-KW-001',
      stock: '50',
      display_order: '0',
      is_active: '1',
      is_featured: '1',
      tags: 'kitchenware,cookware,bestseller',
    }
  ];
  
  return Papa.unparse(template);
};

/**
 * Download CSV template file
 */
export const downloadCSVTemplate = () => {
  const csv = generateCSVTemplate();
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', 'kitchenware-upload-template.csv');
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
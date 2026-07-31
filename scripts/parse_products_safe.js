const fs = require('fs');

const content = fs.readFileSync('extracted_products.json', 'utf8');

function extractValidProducts(raw) {
  const products = [];
  const regex = /\{\s*"_id"\s*:\s*"(\d+)"[\s\S]*?(?=\,\s*\{\s*"_id"\s*:\s*"\d+"|\s*\]\s*$)/g;
  
  let match;
  while ((match = regex.exec(raw)) !== null) {
    let chunk = match[0].trim();
    try {
      const prod = JSON.parse(chunk);
      products.push(prod);
    } catch(e) {
      try {
        let fixedChunk = chunk;
        const openBraces = (fixedChunk.match(/\{/g) || []).length;
        const closeBraces = (fixedChunk.match(/\}/g) || []).length;
        const openBrackets = (fixedChunk.match(/\[/g) || []).length;
        const closeBrackets = (fixedChunk.match(/\]/g) || []).length;
        
        for (let i = 0; i < openBrackets - closeBrackets; i++) fixedChunk += ']';
        for (let i = 0; i < openBraces - closeBraces; i++) fixedChunk += '}';
        
        const prod = JSON.parse(fixedChunk);
        products.push(prod);
        console.log(`Successfully fixed & parsed product ID ${match[1]}`);
      } catch(err2) {
        console.error(`Could not fix product ID ${match[1]}:`, err2.message);
      }
    }
  }
  return products;
}

const products = extractValidProducts(content);
console.log(`Successfully extracted ${products.length} valid products!`);

products.forEach(p => console.log(`Product ID ${p._id}: ${p.Title ? p.Title.substring(0, 50).trim() : 'No title'} (Price: ₹${p.selling_price})`));

fs.writeFileSync('clean_products.json', JSON.stringify(products, null, 2));
console.log("Saved clean_products.json");

const fs = require('fs');

let content = fs.readFileSync('extracted_products.json', 'utf8');
console.log("End of content:", content.slice(-200));

// Let's test JSON.parse with error location
try {
  const data = JSON.parse(content);
  console.log("Parsed successfully! Item count:", data.length);
} catch(err) {
  console.error("Parse error:", err.message);
  // Locate error position
  const posMatch = err.message.match(/position (\d+)/);
  if (posMatch) {
    const pos = parseInt(posMatch[1]);
    console.log("Context around error pos:", content.substring(pos - 100, pos + 100));
  }
}

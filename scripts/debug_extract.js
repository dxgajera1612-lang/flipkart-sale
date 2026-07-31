const fs = require('fs');
const transcriptPath = `C:\\Users\\ASUS\\.gemini\\antigravity\\brain\\3afcb586-3acd-4788-aa59-b0ac978bf43f\\.system_generated\\logs\\transcript_full.jsonl`;

const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n').filter(Boolean);
for (let i = lines.length - 1; i >= 0; i--) {
  try {
    const parsed = JSON.parse(lines[i]);
    if (parsed.type === 'USER_INPUT' && parsed.content) {
      console.log(`Found USER_INPUT step_index: ${parsed.step_index}, length: ${parsed.content.length}`);
      const content = parsed.content;
      const startIdx = content.indexOf('[');
      const lastIdx = content.lastIndexOf(']');
      console.log(`startIdx: ${startIdx}, lastIdx: ${lastIdx}`);
      const arrayStr = content.substring(startIdx, lastIdx + 1);
      fs.writeFileSync('extracted_products.json', arrayStr);
      console.log(`Saved extracted_products.json, length: ${arrayStr.length}`);
      break;
    }
  } catch (e) {
    console.error("Error line parse:", e.message);
  }
}

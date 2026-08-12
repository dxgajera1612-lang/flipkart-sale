const fs = require('fs');
const transcriptPath = `C:\\Users\\ASUS\\.gemini\\antigravity\\brain\\3afcb586-3acd-4788-aa59-b0ac978bf43f\\.system_generated\\logs\\transcript_full.jsonl`;

const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n').filter(Boolean);

for (let i = lines.length - 1; i >= 0; i--) {
  try {
    const item = JSON.parse(lines[i]);
    if (item.step_index === 350) {
      const content = item.content;
      const idx11 = content.indexOf('"_id": "11"');
      if (idx11 !== -1) {
        console.log("=== Product 11 Tail ===");
        console.log(content.substring(idx11 + 3000));
      }
    }
  } catch(e) {}
}

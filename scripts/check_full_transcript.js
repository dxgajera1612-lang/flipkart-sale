const fs = require('fs');
const transcriptPath = `C:\\Users\\ASUS\\.gemini\\antigravity\\brain\\3afcb586-3acd-4788-aa59-b0ac978bf43f\\.system_generated\\logs\\transcript_full.jsonl`;

const content = fs.readFileSync(transcriptPath, 'utf8');
const lines = content.split('\n').filter(Boolean);

for (let i = lines.length - 1; i >= 0; i--) {
  try {
    const item = JSON.parse(lines[i]);
    if (item.type === 'USER_INPUT' && item.content) {
      console.log(`Step ${item.step_index}: content length = ${item.content.length}`);
      const matches = item.content.match(/\{\s*"_id"\s*:\s*"(\d+)"/g);
      if (matches) {
        console.log(`Found ${matches.length} product IDs in step ${item.step_index}`);
        console.log(`First 5 IDs:`, matches.slice(0, 5));
        console.log(`Last 5 IDs:`, matches.slice(-5));
      }
    }
  } catch(e) {}
}

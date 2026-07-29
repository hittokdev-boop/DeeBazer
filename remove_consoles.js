const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.js')) results.push(file);
    }
  });
  return results;
}

const files = walk('./Src');
let changedCount = 0;

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  let changed = false;
  
  const newContent = content.split('\n').map(line => {
    // Check if the line has console.log and is not already commented
    if (line.includes('console.log') && !line.trim().startsWith('//')) {
      // Check if it's likely an error log
      const isErrorLog = /error|err|catch|fail/i.test(line);
      if (!isErrorLog) {
        changed = true;
        return line.replace(/console\.log/g, '// console.log');
      }
    }
    return line;
  }).join('\n');
  
  if (changed) {
    fs.writeFileSync(file, newContent, 'utf8');
    changedCount++;
    console.log('Updated:', file);
  }
});

console.log('Total files updated:', changedCount);

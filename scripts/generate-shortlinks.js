#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../data/shortlinks.json');
const outputDir = path.join(__dirname, '../content/s');

const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const existingFiles = fs.readdirSync(outputDir).filter(f => f.endsWith('.md') && f !== '_index.md');
existingFiles.forEach(file => {
  fs.unlinkSync(path.join(outputDir, file));
});

let count = 0;
Object.entries(data).forEach(([id, url]) => {
  const frontmatter = `---
title: "Redirecting to ${url}"
destination: "${url}"
---
`;

  const filePath = path.join(outputDir, `${id}.md`);
  fs.writeFileSync(filePath, frontmatter);
  console.log(`Generated: /s/${id} -> ${url}`);
  count++;
});

console.log(`\nGenerated ${count} shortlink(s)`);

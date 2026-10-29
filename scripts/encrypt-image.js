#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { webcrypto } = require('crypto');

const [input, requestedId] = process.argv.slice(2);

if (!input) {
  console.error('Usage: node scripts/encrypt-image.js <image> [id]');
  process.exit(1);
}

const id = requestedId ?? Buffer.from(webcrypto.getRandomValues(new Uint8Array(6))).toString('base64url');

if (!/^[A-Za-z0-9_-]+$/.test(id)) {
  console.error(`Invalid id "${id}": use letters, digits, - or _`);
  process.exit(1);
}

const outputDir = path.join(__dirname, '../static/p', id);

if (fs.existsSync(outputDir)) {
  console.error(`/p/${id} already exists`);
  process.exit(1);
}

const jpeg = execFileSync('magick', [
  input,
  '-auto-orient',
  '-strip',
  '-resize', '1600x1600>',
  '-quality', '85',
  'jpeg:-',
], { maxBuffer: 64 * 1024 * 1024 });

const page = (blobPath) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="referrer" content="no-referrer">
<title>fmz.pw</title>
<style>
  html, body { margin: 0; height: 100%; background: #111; color: #888; font: 14px monospace; }
  body { display: flex; align-items: center; justify-content: center; }
  img { max-width: 100vw; max-height: 100vh; object-fit: contain; }
</style>
</head>
<body>
<p id="status">decrypting…</p>
<script>
(async () => {
  const status = document.getElementById('status');
  const keyText = location.hash.slice(1);
  if (!keyText) {
    status.textContent = 'missing key';
    return;
  }
  const keyBytes = Uint8Array.from(atob(keyText.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['decrypt']);
  const blob = new Uint8Array(await (await fetch('${blobPath}')).arrayBuffer());
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: blob.slice(0, 12) }, key, blob.slice(12));
  const img = document.createElement('img');
  img.src = URL.createObjectURL(new Blob([plain], { type: 'image/jpeg' }));
  status.replaceWith(img);
})().catch(() => {
  document.getElementById('status').textContent = 'unable to decrypt';
});
</script>
</body>
</html>
`;

(async () => {
  const keyBytes = webcrypto.getRandomValues(new Uint8Array(32));
  const iv = webcrypto.getRandomValues(new Uint8Array(12));
  const key = await webcrypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt']);
  const ciphertext = new Uint8Array(await webcrypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, jpeg));

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, 'img.bin'), Buffer.concat([iv, ciphertext]));
  fs.writeFileSync(path.join(outputDir, 'index.html'), page(`/p/${id}/img.bin`));

  console.error(`Encrypted ${jpeg.length} bytes -> static/p/${id}/`);
  console.log(`https://fmz.pw/p/${id}/#${Buffer.from(keyBytes).toString('base64url')}`);
})();

const https = require('https');
const zlib = require('zlib');

https.get('https://climateguard.lovable.app/assets/routes-DMyyC4Ue.js', (res) => {
  let chunks = [];
  res.on('data', c => chunks.push(c));
  res.on('end', () => {
    let buf = Buffer.concat(chunks);
    if (res.headers['content-encoding'] === 'gzip') buf = zlib.gunzipSync(buf);
    const text = buf.toString();
    const regex = /children:`([^`]+)`/g;
    let m;
    const matches = new Set();
    while ((m = regex.exec(text)) !== null) {
      if (m[1].length > 4 && m[1].length < 100) matches.add(m[1]);
    }
    console.log('Sample text strings:');
    Array.from(matches).slice(0, 50).forEach(s => console.log('  ' + s));
  });
});

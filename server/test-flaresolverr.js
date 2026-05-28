'use strict';

try { require('dotenv').config({ path: require('path').join(__dirname, '.env') }); } catch {}

const FS_URL = process.env.FLARESOLVERR_URL || 'http://localhost:8191';
const TEST_URL = process.argv[2] || 'https://truyenfull.today/';

async function testHealth() {
  const res = await fetch(`${FS_URL}/health`, { signal: AbortSignal.timeout(5000) });
  const json = await res.json();
  return json;
}

async function testFetch(url) {
  const res = await fetch(`${FS_URL}/v1`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cmd: 'request.get', url, maxTimeout: 60000 }),
    signal: AbortSignal.timeout(70000),
  });
  const json = await res.json();
  return json;
}

(async () => {
  console.log(`FlareSolverr URL : ${FS_URL}`);
  console.log(`Test URL         : ${TEST_URL}\n`);

  // 1. Health check
  process.stdout.write('1. Health check ... ');
  try {
    const h = await testHealth();
    console.log(`OK — version ${h.version}`);
  } catch (e) {
    console.log(`FAIL\n   ${e.message}`);
    console.log('\n→ FlareSolverr chưa chạy. Khởi động bằng:');
    console.log('  docker run -d -p 8191:8191 ghcr.io/flaresolverr/flaresolverr:latest');
    process.exit(1);
  }

  // 2. Fetch URL
  process.stdout.write(`2. Fetching ${TEST_URL} ... `);
  const t0 = Date.now();
  try {
    const json = await testFetch(TEST_URL);
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

    if (json.status !== 'ok') {
      console.log(`FAIL\n   status: ${json.status}\n   message: ${json.message}`);
      process.exit(1);
    }

    const html = json.solution?.response || '';
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch?.[1]?.trim() || '(no title)';
    const statusCode = json.solution?.status || '?';
    const cookies = (json.solution?.cookies || []).length;

    console.log(`OK (${elapsed}s)`);
    console.log(`   HTTP status : ${statusCode}`);
    console.log(`   Title       : ${title}`);
    console.log(`   Cookies     : ${cookies}`);
    console.log(`   HTML size   : ${(html.length / 1024).toFixed(1)} KB`);
    console.log(`   User-Agent  : ${json.solution?.userAgent?.slice(0, 80) || '?'}`);
  } catch (e) {
    console.log(`FAIL\n   ${e.message}`);
    process.exit(1);
  }

  console.log('\nFlareSolverr hoạt động tốt!');
})();

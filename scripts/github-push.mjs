import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const TOKEN = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
const OWNER = 'jaquimarque6-boop';
const REPO = 'neurometric-terapias-backend';
const ROOT = process.env.WORKSPACE_ROOT || '/home/runner/workspace';
const API = 'https://api.github.com';

if (!TOKEN) { console.error('ERROR: GITHUB_PERSONAL_ACCESS_TOKEN not set'); process.exit(1); }

async function ghReq(method, endpoint, body) {
  const res = await fetch(`${API}${endpoint}`, {
    method,
    headers: {
      'Authorization': `token ${TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (json.message && !json.sha && !json.object) {
    throw new Error(`GitHub API error at ${endpoint}: ${json.message}`);
  }
  return json;
}

const EXCLUDE_DIRS = new Set(['node_modules', '.git', '.cache', '.local', 'dist', '.expo', '.expo-shared']);
const EXCLUDE_EXTS = new Set(['.sql', '.tar', '.gz', '.dump', '.zip']);
const EXCLUDE_NAMES = new Set(['.env', '.env.local', '.env.production', '.env.development', 'neurometric_terapias_backup_final.sql', 'neurometric_terapias_backup_final.tar.gz']);

function collectFiles(dir, base) {
  if (!base) base = dir;
  const results = [];
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return results; }
  for (const e of entries) {
    if (EXCLUDE_DIRS.has(e.name)) continue;
    if (EXCLUDE_NAMES.has(e.name)) continue;
    const full = path.join(dir, e.name);
    const rel = path.relative(base, full);
    if (e.isDirectory()) {
      results.push(...collectFiles(full, base));
    } else {
      const ext = path.extname(e.name).toLowerCase();
      if (EXCLUDE_EXTS.has(ext)) continue;
      results.push(rel);
    }
  }
  return results;
}

async function createBlob(relPath) {
  const fullPath = path.join(ROOT, relPath);
  let content, encoding;
  const buf = fs.readFileSync(fullPath);
  const text = buf.toString('utf8');
  if (Buffer.from(text, 'utf8').equals(buf)) {
    content = text;
    encoding = 'utf-8';
  } else {
    content = buf.toString('base64');
    encoding = 'base64';
  }
  const result = await ghReq('POST', `/repos/${OWNER}/${REPO}/git/blobs`, { content, encoding });
  return result.sha;
}

async function run() {
  const files = collectFiles(ROOT);
  console.log(`Found ${files.length} files to push.`);

  const treeItems = [];
  let done = 0;
  const BATCH = 6;

  for (let i = 0; i < files.length; i += BATCH) {
    const batch = files.slice(i, i + BATCH);
    const shas = await Promise.all(batch.map(f => createBlob(f).catch(e => {
      console.warn(`  SKIP ${f}: ${e.message}`);
      return null;
    })));
    for (let j = 0; j < batch.length; j++) {
      if (shas[j]) {
        treeItems.push({ path: batch[j], mode: '100644', type: 'blob', sha: shas[j] });
      }
    }
    done += batch.length;
    process.stdout.write(`\r  Blobs: ${done}/${files.length}`);
  }
  console.log(`\n  Valid blobs: ${treeItems.length}`);

  console.log('Creating tree...');
  const tree = await ghReq('POST', `/repos/${OWNER}/${REPO}/git/trees`, { tree: treeItems });
  console.log(`  Tree SHA: ${tree.sha}`);

  console.log('Creating commit...');
  const commit = await ghReq('POST', `/repos/${OWNER}/${REPO}/git/commits`, {
    message: 'chore: push complete working project from Replit',
    tree: tree.sha,
    parents: [],
  });
  console.log(`  Commit SHA: ${commit.sha}`);

  console.log('Updating main branch ref...');
  const ref = await ghReq('PATCH', `/repos/${OWNER}/${REPO}/git/refs/heads/main`, {
    sha: commit.sha,
    force: true,
  });
  console.log(`  main now points to: ${ref.object?.sha || JSON.stringify(ref)}`);

  console.log('\nDone! Repository updated successfully.');
}

run().catch(e => { console.error('Fatal:', e.message); process.exit(1); });

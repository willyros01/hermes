// Executes an explicit, reviewed inventory of tests. No newly added .test.mjs
// is executed without review; no live Firebase project or credentials are used.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const mode = process.argv[2];
const output = path.resolve(process.argv[3] || 'out-fidunio', mode || 'unknown');
if (!['unit', 'rules'].includes(mode)) throw new Error('Usage: node run-reviewed.mjs unit|rules OUT_DIR');
const root = process.cwd();
const manifest = JSON.parse(fs.readFileSync(new URL('./reviewed-tests.json', import.meta.url), 'utf8'));
const unit = manifest.unit;
const rules = manifest.firestoreRules;
const browser = manifest.browser;
const iosSourceOnly = manifest.iosSourceOnly || [];
for (const file of iosSourceOnly) if (!unit.includes(file)) throw new Error('iOS test classification is not in reviewed unit inventory: ' + file);
const expected = [...unit, ...rules, ...browser].sort();
function walk(dir, rel = '') {
  return fs.readdirSync(dir, {withFileTypes: true}).flatMap(x => {
    if (x.name === 'node_modules' || x.name === '.git' || x.name === 'www' || x.name === 'ios' || x.name === 'android' || x.name === 'ios-src') return [];
    const next = path.posix.join(rel, x.name);
    if (x.isDirectory()) return walk(path.join(dir, x.name), next);
    return x.isFile() && x.name.endsWith('.test.mjs') ? [next] : [];
  });
}
const actual = walk(root).sort();
const missing = expected.filter(x => !actual.includes(x));
const unexpected = actual.filter(x => !expected.includes(x));
if (missing.length || unexpected.length) {
  throw new Error('Reviewed test inventory changed; inspect before executing. Missing: ' +
    JSON.stringify(missing) + '; unreviewed: ' + JSON.stringify(unexpected));
}
if (mode === 'rules') {
  if (!process.env.FIRESTORE_EMULATOR_HOST) throw new Error('Refusing rules tests without FIRESTORE_EMULATOR_HOST');
  if (!/^(localhost|127\.0\.0\.1):\d+$/.test(process.env.FIRESTORE_EMULATOR_HOST)) throw new Error('Firestore emulator must be local');
}
const env = {...process.env};
for (const key of ['GOOGLE_APPLICATION_CREDENTIALS', 'GOOGLE_CLOUD_PROJECT', 'GCLOUD_PROJECT', 'GCP_PROJECT',
  'FIREBASE_TOKEN', 'GH_TOKEN', 'GITHUB_TOKEN', 'FIREBASE_CONFIG', 'FIREBASE_DATABASE_EMULATOR_HOST']) delete env[key];
if (mode === 'rules') env.GCLOUD_PROJECT = 'demo-fidunio-simulator-tests';
fs.mkdirSync(output, {recursive: true});
fs.mkdirSync(path.join(output, 'logs'), {recursive: true});
const selected = mode === 'unit' ? unit : rules;
if (mode === 'unit' && !fs.statSync(path.join(root, 'ios-src', 'package.json'), {throwIfNoEntry: false})?.isFile()) {
  throw new Error('iOS read-only source checkout required for the four iOS-specific regression gates');
}
const results = [];
const started = Date.now();
for (let i = 0; i < selected.length; i++) {
  const file = selected[i];
  const begin = Date.now();
  const source = mode === 'unit' && iosSourceOnly.includes(file) ? 'ios' : 'Android';
  const sourceRoot = source === 'ios' ? path.join(root, 'ios-src') : root;
  if (!fs.existsSync(path.join(sourceRoot,file))) throw new Error('Missing reviewed '+source+' test file: '+file);
  const result = spawnSync(process.execPath, [file], {
    cwd: sourceRoot,
    env,
    encoding: 'utf8',
    timeout: 120000,
    maxBuffer: 16 * 1024 * 1024,
    windowsHide: true
  });
  const combined = String(result.stdout || '') + '\n' + String(result.stderr || '');
  const success = result.status === 0 && !result.error;
  const count = (combined.match(/(?:^|\n)PASS(?:[:\s]|$)/g) || []).length;
  const name = String(i + 1).padStart(3, '0') + '-' + file.replaceAll('/', '__') + '.txt';
  fs.writeFileSync(path.join(output, 'logs', name),
    'FILE ' + file + '\nSOURCE ' + source + '\nEXIT ' + result.status + '\n' +
    (result.error ? 'ERROR ' + result.error.message + '\n' : '') + combined);
  results.push({file, source, pass: success, assertionsReported: count, ms: Date.now() - begin, log: 'logs/' + name,
    error: result.error?.message || (success ? null : 'exit ' + result.status)});
  console.log((success ? 'PASS ' : 'FAIL ') + '['+source+'] '+file + ' (' + count + ' PASS markers)');
  // Preserve an incremental record if the CI runner stops unexpectedly.
  fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({mode, reviewed: selected.length, results}, null, 2) + '\n');
}
const passed = results.filter(x => x.pass).length;
const failed = selected.length - passed;
const lines = [
  '# FIDUNIO ' + (mode === 'unit' ? 'reviewed functional regressions' : 'Firestore emulator security rules'),
  '',
  '**Result: ' + (failed ? 'FAIL' : 'PASS') + ' — ' + passed + '/' + selected.length + ' test files**',
  '',
  '- Source: ' + (process.env.GITHUB_SHA || 'local'),
  '- Run: ' + (process.env.GITHUB_SERVER_URL || 'https://github.com') + '/' +
    (process.env.GITHUB_REPOSITORY || 'willyros01/hermes') + '/actions/runs/' + (process.env.GITHUB_RUN_ID || 'local'),
  '- Duration: ' + ((Date.now() - started) / 1000).toFixed(1) + ' seconds',
  '- PASS markers emitted: ' + results.reduce((a, x) => a + x.assertionsReported, 0),
  '- Firebase: ' + (mode === 'rules' ? 'localhost Firestore emulator; exclusively demo- project IDs' : 'no live backend required'),
  '',
  '| Status | Branch whose expectations apply | Reviewed test file | PASS markers | Log |',
  '| --- | --- | --- | ---: | --- |',
  ...results.map(x => '| ' + (x.pass ? 'PASS' : 'FAIL') + ' | '+x.source+' | `' + x.file + '` | ' +
    x.assertionsReported + ' | [' + x.log + '](' + x.log + ') |'),
  '',
  'A passing source test does not prove a physical notification, camera, native file picker, or multi-user end-to-end journey.',
  ''
];
fs.writeFileSync(path.join(output, 'REPORT.md'), lines.join('\n'));
console.log('FINAL ' + mode + ': ' + passed + '/' + selected.length + ' test files; ' + failed + ' failed');
process.exit(failed ? 1 : 0);

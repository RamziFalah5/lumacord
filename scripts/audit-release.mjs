import { readdir, readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const excluded = new Set(['node_modules', 'dist', '.git', 'references', '.reference-analysis', '.local-backup', '.local-browsers', 'test-results', 'playwright-report', 'blob-report', 'coverage']);
const directories = new Set(['src', 'public', 'docs', 'media', 'tests', 'scripts', '.github']);
const rootFiles = new Set(['.gitignore', '.gitattributes', 'README.md', 'LICENSE', 'package.json', 'package-lock.json', 'index.html', 'tsconfig.json', 'vite.config.ts', 'playwright.config.ts']);
async function walk(directory = '.') {
  const paths = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (excluded.has(entry.name)) continue;
    const path = directory === '.' ? entry.name : `${directory}/${entry.name}`;
    if (entry.isDirectory()) paths.push(...await walk(path));
    else paths.push(path);
  }
  return paths;
}
// Git's index is authoritative once initialized: .gitignore cannot hide tracked files.
const candidates = existsSync('.git')
  ? execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean)
  : await walk();
const issues = [];
for (const path of new Set(candidates)) {
  const top = path.split('/')[0];
  if (!(path.includes('/') ? directories.has(top) : rootFiles.has(path))) {
    issues.push(`Unexpected release path: ${path}`);
    continue;
  }
  if (/\.(png|gif|woff2?)$/i.test(path)) continue;
  const content = await readFile(path, 'utf8');
  // Deliberately report paths, never matching secret values.
  if (/(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}|AKIA[A-Z0-9]{16}|sk-(?:proj-)?[A-Za-z0-9_-]{30,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/.test(content)) issues.push(`Potential secret: ${path}`);
  if (/[A-Z]:[\\/]Users[\\/]|\/Users\/[^/\s]+\/|\/home\/[^/\s]+\//.test(content)) issues.push(`Personal absolute path: ${path}`);
  const emails = content.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? [];
  if (emails.some(email => !/@example\.(com|org|net)$/i.test(email))) issues.push(`Review email attribution/contact: ${path}`);
}
if (existsSync('dist')) {
  async function checkBuild(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = `${directory}/${entry.name}`;
      if (entry.isDirectory()) await checkBuild(path);
      else if (!/\.(html|js|css|woff2?|svg|txt)$/.test(path)) issues.push(`Unexpected build asset: ${path}`);
    }
  }
  await checkBuild('dist');
  const html = await readFile('dist/index.html', 'utf8');
  const assetUrls = [...html.matchAll(/(?:src|href)="([^\"]+)"/g)].map(match => match[1]);
  if (assetUrls.some(url => url.startsWith('/') && !url.startsWith('/lumacord/'))) issues.push('Production asset URL outside /lumacord/');
  if ((await stat('dist/index.html')).size === 0) issues.push('Empty production entry');
}
if (issues.length) {
  issues.forEach(issue => console.error(issue));
  process.exitCode = 1;
} else {
  console.log(`Release hygiene passed for ${new Set(candidates).size} candidate files${existsSync('dist') ? ' and production asset paths' : ''}.`);
  console.log('Pattern checks supplement manual review; project and dependency licenses remain separate.');
}

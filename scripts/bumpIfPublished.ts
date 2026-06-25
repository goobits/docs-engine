import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

type PackageRecord = {
  name: string;
  file: string;
};

type PackageManifest = {
  version?: string;
};

type SemverParts = [number, number, number];

const packages: PackageRecord[] = [
  {
    name: '@goobits/docs-engine',
    file: 'package.json',
  },
  {
    name: '@goobits/docs-engine-cli',
    file: 'packages/docs-engine-cli/package.json',
  },
  {
    name: 'create-docs-engine',
    file: 'packages/create-docs-engine/package.json',
  },
];

const root = path.resolve('.');

function getRegistryVersion(pkgName: string): string | null {
  try {
    const output = execFileSync('npm', ['view', pkgName, 'version', '--json'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (!output) return null;
    const parsed = JSON.parse(output) as unknown;
    return typeof parsed === 'string' ? parsed : null;
  } catch {
    return null;
  }
}

function parseSemver(version: string): SemverParts | null {
  const clean = version.replace(/^v/, '');
  const [core] = clean.split('-');
  const parts = core.split('.').map((part) => Number(part));
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) {
    return null;
  }
  return parts as SemverParts;
}

function compareSemver(a: string, b: string): number {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  if (!pa || !pb) return 0;
  for (let i = 0; i < 3; i += 1) {
    if (pa[i] > pb[i]) return 1;
    if (pa[i] < pb[i]) return -1;
  }
  return 0;
}

function incrementPatch(version: string): string {
  const parts = parseSemver(version);
  if (!parts) return version;
  parts[2] += 1;
  return `${parts[0]}.${parts[1]}.${parts[2]}`;
}

function updateVersion(filePath: string, nextVersion: string): void {
  const fullPath = path.join(root, filePath);
  const current = readFileSync(fullPath, 'utf8');
  const replaced = current.replace(/"version":\s*"[^"]+"/, `"version": "${nextVersion}"`);
  writeFileSync(fullPath, replaced);
}

let bumped = false;

for (const pkg of packages) {
  const registryVersion = getRegistryVersion(pkg.name);
  if (!registryVersion) continue;

  const fullPath = path.join(root, pkg.file);
  const json = JSON.parse(readFileSync(fullPath, 'utf8')) as PackageManifest;
  const localVersion = json.version;
  if (!localVersion) continue;

  if (compareSemver(registryVersion, localVersion) >= 0) {
    const nextVersion = incrementPatch(registryVersion);
    updateVersion(pkg.file, nextVersion);
    bumped = true;
    // Keep stdout concise for release logs.
    console.log(`${pkg.name}: ${localVersion} -> ${nextVersion}`);
  }
}

if (!bumped) {
  console.log('No published version conflicts detected.');
}

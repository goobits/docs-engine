import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const packages = [
  {
    name: "@goobits/docs-engine",
    file: "package.json",
  },
  {
    name: "@goobits/docs-engine-cli",
    file: "packages/docs-engine-cli/package.json",
  },
  {
    name: "create-docs-engine",
    file: "packages/create-docs-engine/package.json",
  },
];

const root = path.resolve(".");

function getRegistryVersion(pkgName) {
  try {
    const output = execSync(`npm view ${pkgName} version --json`, {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
    if (!output) return null;
    return JSON.parse(output);
  } catch {
    return null;
  }
}

function parseSemver(version) {
  const clean = version.replace(/^v/, "");
  const [core] = clean.split("-");
  const parts = core.split(".").map((part) => Number(part));
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) {
    return null;
  }
  return parts;
}

function compareSemver(a, b) {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  if (!pa || !pb) return 0;
  for (let i = 0; i < 3; i += 1) {
    if (pa[i] > pb[i]) return 1;
    if (pa[i] < pb[i]) return -1;
  }
  return 0;
}

function incrementPatch(version) {
  const parts = parseSemver(version);
  if (!parts) return version;
  parts[2] += 1;
  return `${parts[0]}.${parts[1]}.${parts[2]}`;
}

function updateVersion(filePath, nextVersion) {
  const fullPath = path.join(root, filePath);
  const current = readFileSync(fullPath, "utf8");
  const replaced = current.replace(
    /"version":\s*"[^"]+"/,
    `"version": "${nextVersion}"`
  );
  writeFileSync(fullPath, replaced);
}

let bumped = false;

for (const pkg of packages) {
  const registryVersion = getRegistryVersion(pkg.name);
  if (!registryVersion) continue;

  const fullPath = path.join(root, pkg.file);
  const json = JSON.parse(readFileSync(fullPath, "utf8"));
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
  console.log("No published version conflicts detected.");
}

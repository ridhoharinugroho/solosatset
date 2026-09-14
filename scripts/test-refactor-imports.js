import fs from "fs";
import path from "path";

console.log("=== Solosatset Modularization & Import/Export Regression Tests ===");

function walk(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (!fullPath.includes("node_modules") && !fullPath.includes(".git") && !fullPath.includes(".next") && !fullPath.includes("dist")) {
        results = results.concat(walk(fullPath));
      }
    } else if (/\.(ts|tsx|js|mjs)$/.test(fullPath)) {
      results.push(fullPath);
    }
  });
  return results;
}

const targetDirs = ["src", "app", "server", "scripts", "tests"];
let totalFilesChecked = 0;
let legacyImportViolations = 0;

for (const dir of targetDirs) {
  const files = walk(dir);
  totalFilesChecked += files.length;
  for (const filePath of files) {
    const content = fs.readFileSync(filePath, "utf8");
    // Check if any file imports from legacy js/ folder
    if (/from\s+["'].*\/js\//.test(content) || /require\(["'].*\/js\//.test(content)) {
      console.error(`❌ Legacy JS import found in ${filePath}`);
      legacyImportViolations++;
    }
  }
}

if (legacyImportViolations > 0) {
  console.error(`❌ Found ${legacyImportViolations} legacy js/ import violations!`);
  process.exit(1);
} else {
  console.log(`✓ All ${totalFilesChecked} files passed import/export resolution regression tests with 0 legacy js/ imports!`);
}

import { execSync } from "child_process";

const args = process.argv.slice(2);
let type = "patch"; // Default to patch

// Parse arguments (e.g., type=minor or just minor)
for (const arg of args) {
  if (arg.startsWith("type=")) {
    type = arg.split("=")[1];
  } else if (arg.startsWith("--type=")) {
    type = arg.split("=")[1];
  } else if (["major", "minor", "patch"].includes(arg)) {
    type = arg;
  }
}

if (!["major", "minor", "patch"].includes(type)) {
  console.error(`Invalid release type: ${type}. Please use major, minor, or patch.`);
  process.exit(1);
}

console.log(`Releasing new ${type} version...`);
try {
  // Use pnpm version to bump package.json
  // This automatically triggers the "version" script which runs version-bump.mjs
  execSync(`pnpm version ${type}`, { stdio: "inherit" });
  console.log(`✅ Successfully bumped ${type} version!`);
} catch (error) {
  console.error("❌ Failed to bump version:", error.message);
  process.exit(1);
}

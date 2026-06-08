import { mkdir, rename } from "node:fs/promises";

async function main() {
  try {
    await mkdir("exports", { recursive: true });
    await rename("dist/index.html", "exports/Call Sheet Maker.html");
    console.log("Post-build: Renamed dist/index.html -> exports/Call Sheet Maker.html");
  } catch (err) {
    console.error("Post-build step failed:", err);
    process.exit(1);
  }
}

main();

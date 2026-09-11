import sharp from "sharp";
import fs from "fs";

async function optimize() {
  const paths = [
    "assets/img/app-logo.png",
    "assets/img/app-splash.png",
    "public/app-logo.png",
    "public/app-splash.png",
  ];

  for (const p of paths) {
    if (fs.existsSync(p)) {
      await sharp(p)
        .resize(512, 512, { fit: "inside" })
        .png({ quality: 80, compressionLevel: 9 })
        .toFile(p + ".opt.png");
      fs.renameSync(p + ".opt.png", p);
      console.log("Optimized " + p);
    }
  }
}

optimize().catch(console.error);

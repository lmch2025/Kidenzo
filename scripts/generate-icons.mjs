import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const svgPath = path.join(process.cwd(), 'public', 'logo.svg');
const appDir = path.join(process.cwd(), 'src', 'app');
const publicDir = path.join(process.cwd(), 'public');

async function generateIcons() {
  console.log('Generating PNG icons from SVG...');
  try {
    const svgBuffer = fs.readFileSync(svgPath);

    // Favicon (32x32) in app/
    await sharp(svgBuffer)
      .resize(32, 32)
      .png()
      .toFile(path.join(appDir, 'favicon.ico'));

    // App Icon (192x192) in app/ -> icon.png
    await sharp(svgBuffer)
      .resize(192, 192)
      .png()
      .toFile(path.join(appDir, 'icon.png'));

    // PWA Icon (192x192) in public/ for manifest
    await sharp(svgBuffer)
      .resize(192, 192)
      .png()
      .toFile(path.join(publicDir, 'icon-192x192.png'));

    // PWA Icon (512x512) in public/ for manifest
    await sharp(svgBuffer)
      .resize(512, 512)
      .png()
      .toFile(path.join(publicDir, 'icon-512x512.png'));

    // Apple Touch Icon 180x180 (solid background) in app/
    await sharp({
      create: {
        width: 180,
        height: 180,
        channels: 4,
        background: { r: 15, g: 23, b: 42, alpha: 1 } // #0f172a
      }
    })
      .composite([
        {
          input: await sharp(svgBuffer).resize(140, 140).toBuffer(),
          gravity: 'center'
        }
      ])
      .png()
      .toFile(path.join(appDir, 'apple-icon.png'));

    console.log('All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons();

/**
 * SVGからPNG画像を生成するスクリプト
 *
 * 使い方: node scripts/generate-images.mjs
 *
 * 必要なパッケージ: sharp
 * インストール: pnpm add -D sharp
 */

import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '../client/public');

async function generateImages() {
  console.log('🎨 画像を生成中...\n');

  try {
    // Favicon 32x32
    const favicon32 = await sharp(join(publicDir, 'favicon.svg'))
      .resize(32, 32)
      .png()
      .toBuffer();
    writeFileSync(join(publicDir, 'favicon-32x32.png'), favicon32);
    console.log('✅ favicon-32x32.png');

    // Favicon 16x16
    const favicon16 = await sharp(join(publicDir, 'favicon.svg'))
      .resize(16, 16)
      .png()
      .toBuffer();
    writeFileSync(join(publicDir, 'favicon-16x16.png'), favicon16);
    console.log('✅ favicon-16x16.png');

    // Apple Touch Icon 180x180
    const appleTouchIcon = await sharp(join(publicDir, 'apple-touch-icon.svg'))
      .resize(180, 180)
      .png()
      .toBuffer();
    writeFileSync(join(publicDir, 'apple-touch-icon.png'), appleTouchIcon);
    console.log('✅ apple-touch-icon.png');

    // OG Image 1200x630
    const ogImage = await sharp(join(publicDir, 'og-image.svg'))
      .resize(1200, 630)
      .png({ quality: 90 })
      .toBuffer();
    writeFileSync(join(publicDir, 'og-image.png'), ogImage);
    console.log('✅ og-image.png');

    // Favicon ICO (multiple sizes) - 使用するならfavicon.icoも生成
    // const faviconIco = await sharp(join(publicDir, 'favicon.svg'))
    //   .resize(48, 48)
    //   .toFormat('ico')
    //   .toBuffer();
    // writeFileSync(join(publicDir, 'favicon.ico'), faviconIco);

    console.log('\n🎉 すべての画像を生成しました！');
    console.log(`📁 出力先: ${publicDir}`);

  } catch (error) {
    console.error('❌ エラー:', error.message);
    console.log('\n📦 sharpがインストールされていない場合:');
    console.log('   pnpm add -D sharp');
    process.exit(1);
  }
}

generateImages();

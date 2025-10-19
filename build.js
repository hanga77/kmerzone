require('dotenv').config();
const esbuild = require('esbuild');
const fs = require('fs/promises');
const path = require('path');

const distDir = 'dist';

// Common build options for production
const buildOptions = {
  entryPoints: ['index.tsx'],
  bundle: true,
  outfile: path.join(distDir, 'bundle.js'),
  define: {
    'process.env.API_KEY': `"${process.env.API_KEY}"`
  },
  loader: { '.tsx': 'tsx' },
  minify: true,
  sourcemap: false,
};

// Files to copy for production build
const staticFiles = ['index.html', 'manifest.json', 'robots.txt', 'sitemap.xml'];

async function copyStaticFiles(outdir) {
  await fs.mkdir(outdir, { recursive: true });
  await Promise.all(
    staticFiles.map(file => fs.copyFile(file, path.join(outdir, file)))
  );
  console.log(`Static files copied to ${outdir}.`);
}

async function run() {
  try {
    // For production build, output to 'dist' directory
    await copyStaticFiles(distDir);
    await esbuild.build(buildOptions);
    console.log('⚡ Build complete! Output is in the `dist` directory.');
  } catch (error) {
    console.error('An error occurred during the build process:', error);
    process.exit(1);
  }
}

run();
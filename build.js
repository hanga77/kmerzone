require('dotenv').config();
const esbuild = require('esbuild');
const fs = require('fs/promises');
const path = require('path');

const distDir = 'dist';
const shouldServe = process.argv.includes('--serve');

// Common build options
const buildOptions = {
  entryPoints: ['index.tsx'],
  bundle: true,
  define: {
    'process.env.API_KEY': `"${process.env.API_KEY}"`
  },
  loader: { '.tsx': 'tsx' },
};

// Files to copy for production build
const staticFiles = ['index.html', 'manifest.json'];

async function copyStaticFiles(outdir) {
  await fs.mkdir(outdir, { recursive: true });
  await Promise.all(
    staticFiles.map(file => fs.copyFile(file, path.join(outdir, file)))
  );
  console.log(`Static files copied to ${outdir}.`);
}

async function run() {
  try {
    if (shouldServe) {
      // For development, serve from root and build bundle.js in memory/root
      const ctx = await esbuild.context({
        ...buildOptions,
        outfile: 'bundle.js',
        sourcemap: true,
      });

      const { host, port } = await ctx.serve({
        servedir: '.',
        port: 3000,
      });
      console.log(`\n=================================================`);
      console.log(`🚀 Development server started at: http://${host}:${port}`);
      console.log(`=================================================\n`);
    } else {
      // For production build, output to 'dist' directory
      await copyStaticFiles(distDir);
      await esbuild.build({
        ...buildOptions,
        outfile: path.join(distDir, 'bundle.js'),
        minify: true,
        sourcemap: false,
      });
      console.log('⚡ Build complete! Output is in the `dist` directory.');
    }
  } catch (error) {
    console.error('An error occurred during the build process:', error);
    process.exit(1);
  }
}

run();

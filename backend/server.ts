
import express from 'express';
// FIX: Add explicit type imports for express handlers to resolve property not found errors on req and res.
// This was causing conflicts, so we'll use express.Request/Response instead.
// import type { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import esbuild from 'esbuild';
// FIX: Corrected import path to include .js extension for ESM compatibility.
import apiRoutes from './routes.js';

dotenv.config();

const isDev = process.argv.includes('--dev');
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootPath = path.join(__dirname, '..');

// --- ESBUILD DEV WATCHER ---
if (isDev) {
    esbuild.context({
        entryPoints: [path.join(rootPath, 'index.tsx')],
        bundle: true,
        outfile: path.join(rootPath, 'bundle.js'),
        define: { 'process.env.API_KEY': `"${process.env.API_KEY}"` },
        loader: { '.tsx': 'tsx' },
        sourcemap: true,
    }).then(ctx => {
        ctx.watch();
        console.log('[esbuild] Watching for frontend changes...');
    }).catch(err => {
        console.error("[esbuild] Watch failed:", err);
        process.exit(1);
    });
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// --- Serve static resources ---
app.use('/ressources', express.static(path.join(rootPath, 'ressources')));

// --- API ROUTES ---
app.use('/api', apiRoutes);

// --- Static file serving for production and dev ---
if (isDev) {
    // Explicitly serve bundle.js with the correct MIME type to fix loading error
    // FIX: Add explicit Request and Response types to the route handler to resolve overload errors.
    app.get('/bundle.js', (req: express.Request, res: express.Response) => {
        res.type('application/javascript');
        res.sendFile(path.join(rootPath, 'bundle.js'));
    });
    // Serve the root for index.html and other static assets
    app.use(express.static(rootPath));
} else {
    // In production, serve from the 'dist' directory
    const distPath = path.join(rootPath, 'dist');
    app.use(express.static(distPath));
    // SPA fallback for production
    // FIX: Add explicit Request and Response types from express to the route handler to resolve overload and property not found errors.
    app.get('*', (req: express.Request, res: express.Response) => {
        res.sendFile(path.join(distPath, 'index.html'));
    });
}

const PORT = process.env.PORT || 3000;

// This will be ignored by Vercel but used for local development
if (isDev) {
    app.listen(PORT, () => {
        console.log(`\n=================================================`);
        console.log(`🚀 Server running at: http://localhost:${PORT}`);
        console.log(`=================================================\n`);
    });
}

export default app;
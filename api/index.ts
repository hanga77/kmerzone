
// This file is the entry point for Vercel's serverless functions.
// It imports and exports the main Express app from the backend directory.
// FIX: Corrected import path to include .js extension for ESM compatibility.
import server from '../backend/server.js';
export default server;

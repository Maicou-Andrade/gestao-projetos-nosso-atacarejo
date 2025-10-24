import { cpSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('Copying server files to dist...');

// Create dist directory structure
mkdirSync('dist/server', { recursive: true });
mkdirSync('dist/drizzle', { recursive: true });
mkdirSync('dist/shared', { recursive: true });

// Copy server files
cpSync('server', 'dist/server', { recursive: true });
cpSync('drizzle', 'dist/drizzle', { recursive: true });
cpSync('shared', 'dist/shared', { recursive: true });

console.log('Server files copied successfully!');


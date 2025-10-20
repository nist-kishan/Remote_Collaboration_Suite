import { createHash } from 'crypto';

/**
 * Vite plugin to ensure proper MIME types for assets
 */
export function mimeTypePlugin() {
  return {
    name: 'mime-type-plugin',
    generateBundle(options, bundle) {
      // Add MIME type information to the bundle
      for (const fileName in bundle) {
        const chunk = bundle[fileName];
        if (chunk.type === 'chunk') {
          // Ensure JavaScript chunks have proper MIME type
          if (fileName.endsWith('.js') || fileName.endsWith('.mjs')) {
            chunk.fileName = chunk.fileName;
            // Add metadata for proper MIME type detection
            if (!chunk.meta) {
              chunk.meta = {};
            }
            chunk.meta.mimeType = 'application/javascript';
          }
        } else if (chunk.type === 'asset') {
          // Set proper MIME types for assets
          if (fileName.endsWith('.css')) {
            chunk.meta = chunk.meta || {};
            chunk.meta.mimeType = 'text/css';
          } else if (fileName.match(/\.(png|jpg|jpeg|gif|svg|ico)$/)) {
            chunk.meta = chunk.meta || {};
            const ext = fileName.split('.').pop();
            chunk.meta.mimeType = getMimeType(ext);
          }
        }
      }
    }
  };
}

function getMimeType(extension) {
  const mimeTypes = {
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'ico': 'image/x-icon',
    'woff': 'font/woff',
    'woff2': 'font/woff2',
    'ttf': 'font/ttf',
    'eot': 'application/vnd.ms-fontobject'
  };
  
  return mimeTypes[extension] || 'application/octet-stream';
}

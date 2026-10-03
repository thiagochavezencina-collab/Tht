import express from 'express';
import path from 'path';
import { handleStreamProxyRequest } from './src/server/proxyHandler';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // 1. Health check API
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', proxy: 'active', time: new Date().toISOString() });
  });

  // 2. Stream Proxy & School Filter Bypass Intermediate Layer (supports standard and educational camouflage routes)
  app.use(['/api/proxy-stream', '/api/edu-asset', '/api/academic-cache', '/api/docs-stream'], (req, res) => {
    handleStreamProxyRequest(req, res);
  });

  // 3. Vite Middleware (dev) or Static Assets (prod)
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CineStream server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

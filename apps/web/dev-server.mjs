import { createWebAppServer } from './src/runtime/server.mjs';

const port = Number.parseInt(process.env.AIBABY_WEB_PORT || '3000', 10);
const host = process.env.AIBABY_WEB_HOST || '127.0.0.1';

const server = createWebAppServer();

server.listen(port, host, () => {
  process.stdout.write(`AIbaby web dev server listening on http://${host}:${port}\n`);
});

import { createServer } from 'node:http';

import { app } from './app.js';
import { env } from './config/env.js';
import { closeDb } from './database/client.js';

const server = createServer(app);
const host = '0.0.0.0';

server.listen(env.PORT, host, () => {
  console.info(JSON.stringify({ event: 'server_started', host, port: env.PORT, service: env.SERVICE_NAME }));
});

function shutdown(signal: 'SIGINT' | 'SIGTERM'): void {
  console.info(JSON.stringify({ event: 'server_shutdown_started', signal }));
  server.close((error) => {
    void closeDb().finally(() => {
      if (error) {
        console.error('Server shutdown failed', error);
        process.exit(1);
      }

      process.exit(0);
    });
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (reason) => console.error('Unhandled rejection', reason));
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception', error);
  process.exit(1);
});

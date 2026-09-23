import { env, assertEnv } from './config/env.js';
import { createApp } from './app.js';

assertEnv();
const app = createApp();

app.listen(env.port, () => {
  console.log(`Kisan Queue Farmer Queue API running at http://localhost:${env.port}`);
  if (env.frontendOrigin === '*') console.warn('FRONTEND_ORIGIN is "*": every website may call this API.');
});

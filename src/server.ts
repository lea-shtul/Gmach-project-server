import { createApp } from "./app";
import { env } from "./config/env";

const app = createApp();

app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`השרת רץ על פורט ${env.port} (${env.nodeEnv})`);
  // eslint-disable-next-line no-console
  console.log(`Swagger UI: http://localhost:${env.port}/api-docs`);
});

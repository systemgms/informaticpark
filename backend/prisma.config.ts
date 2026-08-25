import { defineConfig } from 'prisma/config';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  datasource: {
    // Use the session/direct connection for migrations when configured.
    url: process.env.DIRECT_URL || process.env.DATABASE_URL,
  },
});

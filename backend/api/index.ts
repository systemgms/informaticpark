import type { Request, Response } from 'express';
import { createApp } from '../src/main';

let appPromise: ReturnType<typeof createApp> | undefined;

export default async function handler(req: Request, res: Response) {
  appPromise ??= createApp();

  const { app } = await appPromise;
  const expressApp = app.getHttpAdapter().getInstance();

  return expressApp(req, res);
}

import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const app = express();

// Configure body parser
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// tRPC API
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Export handler for Vercel
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Rewrite path to match Express routes
  const originalUrl = req.url || '/';
  
  // If it's a tRPC request, ensure it starts with /api/trpc
  if (!originalUrl.startsWith('/api/trpc') && originalUrl.includes('trpc')) {
    req.url = '/api/trpc' + originalUrl.substring(originalUrl.indexOf('trpc') + 4);
  }
  
  return app(req as any, res as any);
}


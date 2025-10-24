import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../server/routers/index.js";
import { createContext } from "../server/_core/context.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: req as any,
    router: appRouter,
    createContext: () => createContext({ req, res } as any),
    onError: ({ error, path }) => {
      console.error(`tRPC Error on '${path}':`, error);
    },
  });
}


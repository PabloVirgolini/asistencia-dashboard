import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { parse } from "cookie";
import { COOKIE_NAME } from "../../shared/const";
import { verifyToken, type JwtPayload } from "../jwt";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: JwtPayload | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: JwtPayload | null = null;

  try {
    // Leer cookie de sesión local
    const cookies = opts.req.headers.cookie ? parse(opts.req.headers.cookie) : {};
    const token = cookies[COOKIE_NAME];
    
    if (token) {
      user = await verifyToken(token);
    }
  } catch (error) {
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}

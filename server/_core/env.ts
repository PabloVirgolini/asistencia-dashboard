import crypto from "crypto";

export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex'),
  databaseUrl: process.env.DATABASE_URL ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.FORGE_API_URL ?? "",
  forgeApiKey: process.env.FORGE_API_KEY ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
};

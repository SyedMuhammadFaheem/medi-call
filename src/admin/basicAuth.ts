import { timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

const ADMIN_USER = "admin";

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function createBasicAuthMiddleware(password: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (header?.startsWith("Basic ")) {
      const decoded = Buffer.from(header.slice(6), "base64").toString();
      const sep = decoded.indexOf(":"); // split on the first colon only: passwords may contain ":"
      const user = decoded.slice(0, sep);
      const pass = decoded.slice(sep + 1);
      if (sep >= 0 && user === ADMIN_USER && safeEqual(pass, password)) {
        next();
        return;
      }
    }
    res.set("WWW-Authenticate", 'Basic realm="medi-call admin"');
    res.status(401).send("Authentication required");
  };
}

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const ACCESS_SECRET: string = process.env.JWT_ACCESS_SECRET || "dev_secret";

interface JwtPayload {
  id: string;
  email: string;
  name?: string;
}

export function authenticateJWT(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or invalid token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, ACCESS_SECRET) as JwtPayload;
    req.user = { id: decoded.id, email: decoded.email, name: decoded.name || null }; // name can be filled later if needed
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
}

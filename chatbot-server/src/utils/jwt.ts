import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ---------- ENV setup ----------
const ACCESS_SECRET: string = process.env.JWT_ACCESS_SECRET || "dev_secret";
const ACCESS_EXP: SignOptions["expiresIn"] =
  (process.env.JWT_ACCESS_EXP as SignOptions["expiresIn"]) || "15m";

const REFRESH_DAYS: number = process.env.REFRESH_TOKEN_EXP_DAYS
  ? Number(process.env.REFRESH_TOKEN_EXP_DAYS)
  : 30;

// ---------- Access Tokens ----------
export function signAccessToken(payload: { id: string; email: string; name?: string | null }): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXP });
}

// ---------- Refresh Tokens ----------
export async function createRefreshTokenAndStore(userId: string) {
  const plainToken = crypto.randomBytes(64).toString("hex"); // 128 hex chars
  const tokenHash = crypto.createHash("sha256").update(plainToken).digest("hex");
  const expiresAt = new Date(Date.now() + REFRESH_DAYS * 24 * 60 * 60 * 1000);

  const created = await prisma.refreshToken.create({
    data: {
      tokenHash,
      expiresAt,
      userId,
    },
  });

  return { id: created.id, plainToken, expiresAt };
}

export async function verifyRefreshTokenAndRotate(incomingPlain: string) {
  const tokenHash = crypto.createHash("sha256").update(incomingPlain).digest("hex");

  const existing = await prisma.refreshToken.findUnique({
    where: { tokenHash },
  });

  if (!existing) throw new Error("Refresh token not found");
  if (existing.revoked) throw new Error("Refresh token revoked");
  if (existing.expiresAt < new Date()) throw new Error("Refresh token expired");

  // Load user
  const user = await prisma.user.findUnique({
    where: { id: existing.userId },
    select: { id: true, email: true, name: true },
  });
  if (!user) throw new Error("User not found");

  // Rotate: create new refresh token, revoke old one
  const { plainToken: newPlain, expiresAt } = await createRefreshTokenAndStore(user.id);

  await prisma.refreshToken.update({
    where: { id: existing.id },
    data: { revoked: true, replacedById: undefined },
  });

  const accessToken = signAccessToken({ id: user.id, email: user.email, name: user.name });

  return {
    accessToken,
    refreshTokenPlain: newPlain,
    expiresAt,
    user,
  };
}

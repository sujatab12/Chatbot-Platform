import { Router } from "express";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { serialize } from "cookie";
import crypto from "crypto";
import {
  signAccessToken,
  createRefreshTokenAndStore,
  verifyRefreshTokenAndRotate,
} from "../utils/jwt";

const prisma = new PrismaClient();
const router = Router();

// --- Register ---
router.post("/register", async (req, res) => {
  const { email, password, name } = req.body;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ message: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashed, name },
    });

    const accessToken = signAccessToken({ id: user.id, email: user.email, name: user.name });
    const refresh = await createRefreshTokenAndStore(user.id);

    res.setHeader("Set-Cookie", serialize("refreshToken", refresh.plainToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/", // send cookie to all endpoints
    }));

    res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name },
      accessToken,
      refreshExpiresAt: refresh.expiresAt,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// --- Login ---
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });

    const accessToken = signAccessToken({ id: user.id, email: user.email, name: user.name });
    const refresh = await createRefreshTokenAndStore(user.id);

    res.setHeader("Set-Cookie", serialize("refreshToken", refresh.plainToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/", // send cookie to all endpoints
    }));

    res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name },
      accessToken,
      refreshExpiresAt: refresh.expiresAt,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// --- Refresh ---
router.post("/refresh", async (req, res) => {
  const incoming = req.cookies.refreshToken; // read cookie
  if (!incoming) return res.status(400).json({ message: "Refresh token missing" });

  try {
    const rotation = await verifyRefreshTokenAndRotate(incoming);

    // Set new refresh token in cookie
    res.setHeader("Set-Cookie", serialize("refreshToken", rotation.refreshTokenPlain, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    }));

    res.json({
      user: rotation.user,
      accessToken: rotation.accessToken,
      refreshExpiresAt: rotation.expiresAt,
    });
  } catch (err: any) {
    console.error(err);
    res.status(401).json({ message: err.message || "Invalid refresh token" });
  }
});


// --- Logout ---
router.post("/logout", async (req, res) => {
  const incoming = req.cookies.refreshToken;
  if (!incoming) return res.status(400).json({ message: "Refresh token missing" });

  try {
    const tokenHash = crypto.createHash("sha256").update(incoming).digest("hex");
    await prisma.refreshToken.updateMany({ where: { tokenHash }, data: { revoked: true } });

    // Clear cookie
    res.setHeader("Set-Cookie", serialize("refreshToken", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    }));

    res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});



export default router;

import { Router } from "express";
import { authenticateJWT } from "../middleware/auth";

const router = Router();

// Protected endpoint
router.get("/me", authenticateJWT, (req, res) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  res.json({
    id: req.user.id,
    email: req.user.email,
    name: req.user.name,
  });
});

export default router;

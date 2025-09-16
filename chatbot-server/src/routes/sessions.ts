import express from "express";
import { authenticateJWT } from "../middleware/auth";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

// Create a new chat session
router.post("/", authenticateJWT, async (req: any, res) => {
  try {
    const { projectId, title } = req.body;
    
    if (!projectId) {
      return res.status(400).json({ message: "Project ID is required" });
    }

    // Verify the project belongs to the user
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: req.user.id },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const session = await prisma.chatSession.create({
      data: {
        title: title || `Chat with ${project.name}`,
        projectId,
        userId: req.user.id,
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    res.json(session);
  } catch (error) {
    console.error("Create session error:", error);
    res.status(500).json({ message: "Failed to create session" });
  }
});

// Get all sessions for a project
router.get("/project/:projectId", authenticateJWT, async (req: any, res) => {
  try {
    const { projectId } = req.params;

    // Verify the project belongs to the user
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: req.user.id },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const sessions = await prisma.chatSession.findMany({
      where: { projectId, userId: req.user.id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    res.json(sessions);
  } catch (error) {
    console.error("Get sessions error:", error);
    res.status(500).json({ message: "Failed to get sessions" });
  }
});

// Get a specific session
router.get("/:sessionId", authenticateJWT, async (req: any, res) => {
  try {
    const { sessionId } = req.params;

    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId: req.user.id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    res.json(session);
  } catch (error) {
    console.error("Get session error:", error);
    res.status(500).json({ message: "Failed to get session" });
  }
});

// Delete a session
router.delete("/:sessionId", authenticateJWT, async (req: any, res) => {
  try {
    const { sessionId } = req.params;

    // Verify the session belongs to the user
    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId: req.user.id },
    });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Delete all messages in the session first
    await prisma.message.deleteMany({
      where: { sessionId },
    });

    // Delete the session
    await prisma.chatSession.delete({
      where: { id: sessionId },
    });

    res.json({ message: "Session deleted successfully" });
  } catch (error) {
    console.error("Delete session error:", error);
    res.status(500).json({ message: "Failed to delete session" });
  }
});

export default router;

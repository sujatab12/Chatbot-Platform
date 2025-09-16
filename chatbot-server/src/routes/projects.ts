import express from "express";
import { authenticateJWT } from "../middleware/auth";
import { PrismaClient } from "@prisma/client";
import { Agent, run } from "@openai/agents";

const router = express.Router();
const prisma = new PrismaClient();

// Create project + agent
router.post("/", authenticateJWT, async (req: any, res) => {
  try{
    const { name, instructions, model, isPublic } = req.body;
    if (!name) return res.status(400).json({ message: "Name is required" });

    const project = await prisma.project.create({
      data: {
        name,
        instructions: instructions || '',
        model: model || 'gpt-4o-mini',
        isPublic: isPublic || false,
        shareUrl: `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: req.user.id,
      },
    });

    res.json(project);
  }
  catch(err){
    console.error(err);
    res.status(500).json({ message: "Failed to create project" });
  }
});

// Get all projects for the user
router.get("/", authenticateJWT, async (req: any, res) => {
  try{
    const projects = await prisma.project.findMany({
      where: { userId: req.user.id },
    });
    
    res.json(projects);
  }
  catch(err){
    console.error(err);
    res.status(500).json({ message: "Failed to get projects" });
  }
});

// Get public project by shareUrl (no authentication required)
router.get("/public/:shareUrl", async (req: any, res) => {
  try {
    const { shareUrl } = req.params;
    
    const project = await prisma.project.findFirst({
      where: { 
        shareUrl,
        isPublic: true 
      },
      select: {
        id: true,
        name: true,
        instructions: true,
        model: true,
        isPublic: true,
        shareUrl: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    if (!project) {
      return res.status(404).json({ message: "Public agent not found" });
    }
    
    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get public project" });
  }
});

// Get a single project by id
router.get("/:id", authenticateJWT, async (req: any, res) => {
  try{
    const project = await prisma.project.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json(project);
  }
  catch(err){
    console.error(err);
    res.status(500).json({ message: "Failed to get project" });
  }
});

// Update a project
router.put("/:id", authenticateJWT, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { name, instructions, model, isPublic } = req.body;

    if (!name) return res.status(400).json({ message: "Name is required" });

    const project = await prisma.project.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!project) return res.status(404).json({ message: "Project not found" });

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        name,
        instructions: instructions || project.instructions,
        model: model || project.model,
        isPublic: isPublic !== undefined ? isPublic : project.isPublic,
      },
    });

    res.json(updatedProject);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update project" });
  }
});

// Delete a project
router.delete("/:id", authenticateJWT, async (req: any, res) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!project) return res.status(404).json({ message: "Project not found" });

    // Delete all related data first
    await prisma.message.deleteMany({
      where: { projectId: id },
    });

    await prisma.chatSession.deleteMany({
      where: { projectId: id },
    });

    // Delete the project
    await prisma.project.delete({
      where: { id },
    });

    res.json({ message: "Project deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete project" });
  }
});

// Public chat with an agent (no authentication required)
router.post("/public/:shareUrl/chat", async (req: any, res) => {
  try {
    const { content, context = [] } = req.body;
    const { shareUrl } = req.params;

    const project = await prisma.project.findFirst({
      where: { 
        shareUrl,
        isPublic: true 
      },
    });
    
    if (!project) return res.status(404).json({ message: "Public agent not found" });

    // Create agent with conversation context
    const agent = new Agent({
      name: project.name,
      instructions: project.instructions,
      model: project.model || "gpt-4o-mini",
    });

    // Build conversation context if provided - optimized for efficiency
    let conversationContext = "";
    if (context && context.length > 0) {
      // Limit context to avoid token limits and improve performance
      const recentContext = context.slice(-6); // Only use last 6 messages
      
      conversationContext = "Previous conversation:\n";
      recentContext.forEach((msg: any) => {
        const role = msg.role === 'user' ? 'User' : 'Assistant';
        conversationContext += `${role}: ${msg.content}\n`;
      });
      conversationContext += "\nCurrent message: ";
    }

    // Combine context with the current message
    const fullMessage = conversationContext + content;

    const result = await run(agent, fullMessage);
    const reply = result.finalOutput || "No response generated";

    res.json({ 
      reply: result.finalOutput,
      agent: {
        id: project.id,
        name: project.name,
        description: project.instructions,
        model: project.model || "gpt-4o-mini"
      }
    });
  } catch (error) {
    console.error("Public chat error:", error);
    res.status(500).json({ message: "Failed to process chat message" });
  }
});

// Chat with an agent (with conversation context)

router.post("/:projectId/chat", authenticateJWT, async (req: any, res) => {
  try {
    const { content, sessionId } = req.body;
    const { projectId } = req.params;

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: req.user.id },
    });
    if (!project) return res.status(404).json({ message: "Not found" });

    // If sessionId is provided, use that session, otherwise create a new one
    let session;
    if (sessionId) {
      session = await prisma.chatSession.findFirst({
        where: { id: sessionId, projectId, userId: req.user.id },
      });
    }

    if (!session) {
      // Create a new session
      session = await prisma.chatSession.create({
        data: {
          title: `Chat with ${project.name}`,
          projectId,
          userId: req.user.id,
        },
      });
    }

    // Fetch conversation history for this specific session
    const previousMessages = await prisma.message.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: "asc" },
      take: 20, // Limit to last 20 messages to avoid token limits
    });

    // Create agent with conversation context
    const agent = new Agent({
      name: project.name,
      instructions: project.instructions,
      model: "gpt-4o-mini",
    });

    // Build conversation context in a more structured way
    let conversationContext = "";
    if (previousMessages.length > 0) {
      conversationContext = "Here is the conversation history for context:\n\n";
      previousMessages.forEach(msg => {
        const role = msg.role === "user" ? "User" : "Assistant";
        conversationContext += `${role}: ${msg.content}\n\n`;
      });
      conversationContext += "Now, please respond to this new message:\n";
    }

    // Combine context with current message
    const fullMessage = conversationContext + content;

    const result = await run(agent, fullMessage);
    const reply = result.finalOutput || "No response generated";

    // Save both user and agent messages in DB with session ID
    await prisma.message.create({
      data: { content, role: "user", projectId, sessionId: session.id },
    });
    await prisma.message.create({
      data: { content: reply, role: "agent", projectId, sessionId: session.id },
    });

    // Update session timestamp
    await prisma.chatSession.update({
      where: { id: session.id },
      data: { updatedAt: new Date() },
    });

    res.json({ 
      reply: result.finalOutput,
      sessionId: session.id 
    });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ message: "Failed to process chat message" });
  }
});


// Get messages for a project
router.get("/:projectId/messages", authenticateJWT, async (req: any, res) => {
  const { projectId } = req.params;

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: req.user.id },
  });
  if (!project) return res.status(404).json({ message: "Not found" });

  const messages = await prisma.message.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
  });

  res.json(messages);
});

// Delete all messages for a project (clear chat history)
router.delete("/:projectId/messages", authenticateJWT, async (req: any, res) => {
  try {
    const { projectId } = req.params;

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: req.user.id },
    });
    if (!project) return res.status(404).json({ message: "Not found" });

    await prisma.message.deleteMany({
      where: { projectId },
    });

    res.json({ message: "Messages deleted successfully" });
  } catch (error) {
    console.error("Delete messages error:", error);
    res.status(500).json({ message: "Failed to delete messages" });
  }
});



export default router;

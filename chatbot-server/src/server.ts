
import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
//import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import meRoutes from "./routes/me";
import projectRoutes from "./routes/projects";
import sessionRoutes from "./routes/sessions";

//dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

// Routes
app.use("/auth", authRoutes);
app.use("/api", meRoutes);
app.use("/projects", projectRoutes);
app.use("/sessions", sessionRoutes);

app.get("/", (_req, res) => {
  res.send("Backend is running 🚀");
});

app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});

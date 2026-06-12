import "dotenv/config"
import express from "express"
import { createServer } from "http"
import authRoutes from "./routes/auth"
import cors from "cors"
import cookieParser from "cookie-parser"
import ingestRoutes from "./routes/ingest"
import runRoutes from "./routes/run"
import analyticsRoutes from "./routes/analytics"
import apiKeyRoutes from "./routes/api-keys"
import explainRoutes from "./routes/explain"
import playgroundRoutes from "./routes/playground"
import { authMiddleware } from "./auth-middleware"
import { initSocket } from "./socket"
import { rateLimit } from "express-rate-limit"

const app = express();
const httpServer = createServer(app);
initSocket(httpServer);

app.use(express.json())
app.use(cookieParser())

app.use(cors({
    origin: "rackleai.vercel.app",
    credentials: true
}))

const PORT = process.env.PORT ?? 8000;

const ingestLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 300, // limit each IP to 300 requests per windowMs
  message: { error: "Too many requests from this IP, please try again after a minute" }
});

app.get("/", (req, res) => {
    res.send({ message: "You're inside the server"})
})

app.use("/auth", authRoutes)
app.use("/api/ingest", authMiddleware, ingestLimiter, ingestRoutes)
app.use("/runs/analytics", authMiddleware, analyticsRoutes)
app.use("/runs", authMiddleware, runRoutes)
app.use("/auth/api-keys", authMiddleware, apiKeyRoutes)
app.use("/api/explain", authMiddleware, explainRoutes)
app.use("/api/playground", authMiddleware, playgroundRoutes)

httpServer.listen(PORT, () => {
    console.log("Server is Up and Listening on 8000")
})


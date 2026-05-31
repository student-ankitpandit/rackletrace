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
import { authMiddleware } from "./auth-middleware"
import { initSocket } from "./socket"

const app = express();
const httpServer = createServer(app);
initSocket(httpServer);

app.use(express.json())
app.use(cookieParser())

app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}))

const PORT = process.env.PORT ?? 8000;

app.get("/", (req, res) => {
    res.send({ message: "You're inside the server"})
})

app.use("/auth", authRoutes)
app.use("/api/ingest", authMiddleware, ingestRoutes)
app.use("/runs/analytics", authMiddleware, analyticsRoutes)
app.use("/runs", authMiddleware, runRoutes)
app.use("/auth/api-keys", authMiddleware, apiKeyRoutes)

httpServer.listen(PORT, () => {
    console.log("Server is Up and Listening on 8000")
})


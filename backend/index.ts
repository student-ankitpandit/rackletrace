import "dotenv/config"
import express from "express"
import authRoutes from "./routes/auth"
import cors from "cors"
import cookieParser from "cookie-parser"  

const app = express();

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


app.listen(PORT, () => {
    console.log("Server is Up and Listening on 8000")
})


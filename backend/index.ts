import "dotenv/config"
import express from "express"
import authRoutes from "./routes/auth"

const app = express();


app.use(express.json())


const PORT = process.env.PORT ?? 8000;

app.get("/", (req, res) => {
    res.send({ message: "You're inside the server"})
})

app.use("/auth", authRoutes)


app.listen(PORT, () => {
    console.log("Server is Up and Listening on 8000")
})


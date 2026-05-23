import express from "express"

const app = express();

const PORT = process.env.PORT ?? 8000;

app.get("/", (req, res) => {
    res.send({ message: "You're inside the server"})
})

app.listen(PORT, () => {
    console.log("Server is Up and Listening on 8000")
})


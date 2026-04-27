import express, { Router } from "express";
import { router } from "./routes/v1";
import cors from "cors"
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json());

app.use(cors({
    origin: 'http://localhost:5173', 
    credentials: true,
}))

app.use("/api/v1", router);

app.listen(process.env.PORT || 3000);
console.log("Server listening on 3000")
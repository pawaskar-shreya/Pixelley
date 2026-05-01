import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken"

export const userMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const headerToken = req.headers["authorization"];
    const token = headerToken?.split(" ")[1];

    if(!token) {
        return res.status(403).json({
            message: "Unauthorized access"
        })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_PASSWORD as string) as {
            userId: string, 
            username: string
        }

        req.userId = decoded.userId; 

        next();
    } catch(e) {
        console.log(e);
        return res.status(401).json({
            message: "Unauthorized access"
        })
    }
}
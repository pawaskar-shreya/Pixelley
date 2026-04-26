import { NextFunction, Request, Response } from "express"
import jwt from "jsonwebtoken";
import { Role } from "@pixelley/db";

export const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const headerToken = req.headers["authorization"];
    const token = headerToken?.split(" ")[1];

    if(!token) {
        return res.status(403).json({
            message: "Unauthorized access"
        })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_PASSWORD  as string) as {
            userId: string,
            username: string, 
            role: Role                                     // added the role here as enum
        }

        if(decoded.role != Role.Admin) {
            return res.status(403).json({
                message: "Unauthorized access"
            })
        }

        req.userId = decoded.userId; 
        
        next();
    } catch(e) {
        return res.status(401).json({                       // 401 as lack of valid creadentials
            message: "Unauthorized access"
        })
    }
}
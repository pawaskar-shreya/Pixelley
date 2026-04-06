import { Router } from "express";
import { adminMiddleware } from "../../middleware/admin";
import { CreateElementSchema } from "../../types";

export const adminRouter = Router();

adminRouter.post("/element", adminMiddleware, async (req, res) => {
    const parsedData = CreateElementSchema.safeParse(req.body);

    
})

adminRouter.put("/element/:elementId", adminMiddleware, async (req, res) => {
    
})

adminRouter.post("/avatar", adminMiddleware, async (req, res) => {
    
})

adminRouter.post("/map", adminMiddleware, async (req, res) => {
    
})
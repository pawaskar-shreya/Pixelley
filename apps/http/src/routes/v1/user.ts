import { Router } from "express";
import { BulkMetadataSchema } from "../../types";
import { prisma } from "@pixelley/db";
import { userMiddleware } from "../../middleware/user";

export const userRouter = Router();

userRouter.post("/metadata/bulk", userMiddleware, async (req, res) => {
    const parsedData = BulkMetadataSchema.safeParse(req.query.ids)

    if(!parsedData.success) {
        return res.status(400).json({
            message: "Send valid Input"
        })
    }

    const metadata = await prisma.user.findMany({
        where: {
            id: {
                in: parsedData.data
            }
        }, select: {
            id: true, 
            avatar: true
        }
    })

    return res.status(200).json({
        avatars: metadata.map(m => ({
            userId: m.id, 
            idleUrl: m.avatar?.idleUrl
        }))
    })
})
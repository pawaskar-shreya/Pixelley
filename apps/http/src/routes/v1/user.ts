import { Router } from "express";
import { BulkMetadataSchema, UpdateMetadataSchema } from "../../types";
import { prisma } from "@pixelley/db/prisma";
import { userMiddleware } from "../../middleware/user";

export const userRouter = Router();

userRouter.post("/metadata", userMiddleware, async (req, res) => {
    const parsedData = UpdateMetadataSchema.safeParse(req.body);

    if(!parsedData.success) {
        return res.status(400).json({
            message: "Invalid Inputs"
        })
    }

    try {
        const updateRes = await prisma.user.update({
            where: {
                id: req.userId 
            }, 
            data: {
                avatarId: parsedData.data.avatarId 
            },
        })

        return res.status(200).json({
            message: "Avatar updated"
        })
    } catch(e) {
        return res.status(400).json({
            message: "Select valid avatars"
        })
    }
})

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
            imageUrl: m.avatar?.imageUrl
        }))
    })
})
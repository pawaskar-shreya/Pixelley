import { Router } from "express";
import { CreateSpaceSchema } from "../../types";
import { userMiddleware } from "../../middleware/user";
import { prisma } from "@pixelley/db/prisma";

export const spaceRouter = Router();

spaceRouter.post("/", userMiddleware, async (req, res) => {
    const parsedData = CreateSpaceSchema.safeParse(req.body);

    if(!parsedData.success) {
        return res.status(400).json({
            message: "Send valid Input"
        })
    }

    try {
        if(!parsedData.data.mapId) {
            const space = await prisma.space.create({
                data: {
                    name: parsedData.data.name,
                    width: parseInt(parsedData.data.dimensions.split("x")[0]!),
                    height:  parseInt(parsedData.data.dimensions.split("x")[1]!),
                    creatorId: req.userId!
                }
            })

            return res.status(200).json({
                spaceId: space.id
            })
        } else {
            const map = await prisma.map.findUnique({
                where: {
                    id: parsedData.data.mapId
                }, 
                select: {
                    width: true, 
                    height: true, 
                    mapElements: true
                }
            })

            if(!map) {
                return res.status(400).json({
                    message: "Select a valid map"
                })
            }

            await prisma.$transaction(async () => {
                // first creating a space in the Space table
                const createSpace = await prisma.space.create({
                    data: {
                        name: parsedData.data.name, 
                        width: map.width,
                        height: map.height,
                        creatorId: req.userId!, 
                    }
                })

                // Then creating its elemets in the spaceElements table
                await prisma.spaceElements.createMany({
                    data: map.mapElements.map(ele => ({
                        spaceId: createSpace.id, 
                        elementId: ele.id, 
                        x: ele.x!, 
                        y: ele.y!
                    }))
                })

                return res.status(200).json({
                    spaceId: createSpace.id
                })
            })
        }
    } catch(e) {
        return res.status(400).json({
            message: "Send valid Input"
        })
    }
})

spaceRouter.delete("/:spaceId", (req, res) => {
    // const parsedData = 
})

spaceRouter.get("/all", (req, res) => {
    
})

spaceRouter.get("/:spaceId", (req, res) => {
    
})

spaceRouter.post("/element", (req, res) => {
    
})

spaceRouter.delete("/element", (req, res) => {
    
})

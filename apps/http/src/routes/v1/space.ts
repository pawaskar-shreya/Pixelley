import { Request, Router } from "express";
import { AddElementSchema, DeleteElementSchema, Params } from "../../types";
import { userMiddleware } from "../../middleware/user";
import { prisma } from "@pixelley/db";

export const spaceRouter = Router();

spaceRouter.get("/", async (req, res) => {
    const Allspaces = await prisma.space.findMany({})

    return res.status(200).json({
        spaces: Allspaces.map(space => ({
            id: space.id,
            name: space.name, 
            width: space.width,
            height: space.height,
            tilemapUrl: space.tilemapUrl,
            thumbnail: space.thumbnail
        }))
    })
})

spaceRouter.post("/element", userMiddleware, async (req, res) => {
    const parsedData = AddElementSchema.safeParse(req.body);

    if(!parsedData.success) {
        return res.status(400).json({
            message: "Send valid Input"
        })
    }

    const space = await prisma.space.findUnique({
        where: {
            id: parsedData.data.spaceId
        }, 
        select: {
            width: true, 
            height: true
        }
    })

    if(!space) {
        return res.status(400).json({
            message: "Space not found"
        })
    }

    if(req.body.x < 0 || req.body.y < 0 || req.body.x > space?.width || req.body.y > space?.height!) {
        return res.status(400).json({
            message: "Cannot place the element outside the space"
        })
    }

    await prisma.spaceElement.create({
        data: {
            elementId: parsedData.data.elementId, 
            spaceId: parsedData.data.spaceId, 
            addedById: req.userId!,
            x: parsedData.data.x, 
            y: parsedData.data.y, 
        }
    })

    return res.status(200).json({
        message: "New element created"
    })
})

spaceRouter.delete("/element", userMiddleware, async (req, res) => {
    const parsedData = DeleteElementSchema.safeParse(req.body);

    if(!parsedData.success) {
        return res.status(400).json({
            message: "Send valid Input"
        })
    }

    const spaceElement = await prisma.spaceElement.findUnique({
        where: {
            id: parsedData.data.id
        }, 
        include: {
            space: true
        }
    })

    if(!spaceElement?.addedById || spaceElement.addedById !== req.userId) {
        return res.status(403).json({
            message: "Unauthorized"
        })
    }

    await prisma.spaceElement.delete({
        where: {
            id: parsedData.data.id
        }
    })

    return res.status(200).json({
        message: "Element deleted successfully"
    })
})

spaceRouter.get("/:spaceId/elements", async (req: Request<Params>, res) => {
    const { spaceId } = req.params;

    if(!spaceId) {
        return res.status(404).json({
            message: "Space not found"
        })
    }

    const allElements = await prisma.element.findMany({
        where: {
            spaceId: spaceId
        }   
    });

    return res.status(200).json({
        elements: allElements.map(ele => ({
            id: ele.id, 
            name: ele.name, 
            width: ele.width, 
            height: ele.height, 
            isCollidable: ele.isCollidable,
            imageUrl: ele.imageUrl
        }))
    })
})

spaceRouter.get("/:spaceId", async (req, res) => {
    const spaceId = req.params.spaceId

    const space = await prisma.space.findUnique({
        where: {
            id: spaceId
        }, 
        include: {
            spaceElements: {
                include: {
                    element: true
                }
            }
        }
    })

    if(!space) {
        return res.status(400).json({
            message: "Send valid Input"
        })
    }

    return res.status(200).json({
        name : space.name,
        tilemapUrl: space.tilemapUrl,
        elements: space.spaceElements.map(spEle => ({
            id: spEle.id, 
            x: spEle.x, 
            y: spEle.y, 
            addedById: spEle.addedById,
            element: {
                id: spEle.element.id, 
                imageUrl: spEle.element.imageUrl, 
                width: spEle.element.width, 
                height: spEle.element.height, 
                isCollidable: spEle.element.isCollidable
            }
        }))
    })
})
import { Request, Router } from "express";
import { AddElementSchema, UpdateElementPositionSchema, DeleteElementSchema, Params } from "../../types";
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
            thumbnail: space.thumbnail
        }))
    })
})

spaceRouter.post("/element", async (req, res) => {
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

    const { x, y } = parsedData.data;

    if (x < 0 || y < 0 || x > space.width || y > space.height) {
        return res.status(400).json({
            message: "Cannot place the element outside the space"
        })
    }

    const addedElement = await prisma.spaceElement.create({
        data: {
            elementId: parsedData.data.elementId,
            spaceId: parsedData.data.spaceId,
            addedById: req.userId!,
            x: parsedData.data.x,
            y: parsedData.data.y,
        }
    })

    return res.status(200).json({
        message: "New element created",
        id: addedElement.id
    })
})

spaceRouter.delete("/element", async (req, res) => {
    const parsedData = DeleteElementSchema.safeParse(req.body);

    if (!parsedData.success) {
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

spaceRouter.put("/element/:id", async (req, res) => {
    const { id } = req.params;
    const parsedData = UpdateElementPositionSchema.safeParse(req.body);

    if (!parsedData.success) {
        return res.status(400).json({ message: "Send valid x and y" });
    }

    const spaceElement = await prisma.spaceElement.findUnique({
        where: { id },
        include: { space: true }
    });

    if (!spaceElement) {
        return res.status(404).json({ message: "Element not found" });
    }

    if (spaceElement.addedById !== req.userId) {
        return res.status(403).json({ message: "Unauthorized" });
    }

    const { x, y } = parsedData.data;
    const { width, height } = spaceElement.space;

    if (x < 0 || y < 0 || x > width || y > height) {
        return res.status(400).json({ message: "Position outside space bounds" });
    }

    const updated = await prisma.spaceElement.update({
        where: { id },
        data: { x, y }
    });

    return res.status(200).json({ message: "Element position updated", id: updated.id });
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
    const spaceId = req.params.spaceId as string;

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
        name: space.name,
        width: space.width,
        height: space.height,
        elements: space.spaceElements.map(spEle => ({
            id: spEle.id, 
            x: spEle.x, 
            y: spEle.y, 
            addedById: spEle.addedById,
            element: {
                id: spEle.element.id, 
                name: spEle.element.name,
                imageUrl: spEle.element.imageUrl, 
                width: spEle.element.width, 
                height: spEle.element.height, 
                isCollidable: spEle.element.isCollidable
            }
        }))
    })
})
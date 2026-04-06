import { Request, Router } from "express";
import { AddElementSchema, CreateSpaceSchema, DeleteElementSchema, Params } from "../../types";
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

            const newSpace = await prisma.$transaction(async () => {
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

                return createSpace;
            })

            // Dont do the http response inside transactions, keep transactions purely for DB operations
            return res.status(200).json({
                message: "Space created successfully"
            })
        }
    } catch(e) {
        console.log(e);

        return res.status(400).json({
            message: "Send valid Input"
        })
    }
})

spaceRouter.delete("/:spaceId", userMiddleware, async (req: Request<Params>, res) => {
    const spaceId = req.params.spaceId;

    const space = await prisma.space.findUnique({
        where: {
            id: spaceId
        }, 
        select: {
            creatorId: true
        }
    })

    if(!space) {
        return res.status(400).json({
            message: "Space not found"
        })
    }

    if(space.creatorId !== req.userId) {
        return res.status(403).json({
            message: "Unauthorized access"
        })
    }

    try {
        await prisma.$transaction(async () => {
            // Delete the space elements first 
            await prisma.spaceElements.deleteMany({
                where: {
                    spaceId : spaceId
                }
            })

            // And then delete the space
            await prisma.space.delete({
                where: {
                    id: spaceId
                }
            })

            return res.status(200).json({
                message: "Space deleted successfully"
            })
        })
    } catch(e) {
        return res.status(400).json({
            message: "Select a valid Space"
        })
    }
})

spaceRouter.get("/all", userMiddleware, async (req, res) => {
    const Allspaces = await prisma.space.findMany({
        where: {
            creatorId: req.userId
        }
    })

    return res.status(200).json({
        spaces: Allspaces.map(space => ({
            id: space.id,
            name: space.name, 
            dimensions: `${space.width}x${space.height}`,
            thumbnail: space.thumbnail
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
        dimensions: `${space.width}x${space.height}`,
        elements: space.spaceElements.map(spEle => ({
            id: spEle.id, 
            x: spEle.x, 
            y: spEle.y, 
            element: {
                id: spEle.element.id, 
                imageUrl: spEle.element.imageUrl, 
                width: spEle.element.width, 
                height: spEle.element.height, 
                static: spEle.element.static
            }
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
            id: parsedData.data.spaceId, 
            creatorId: req.userId                           // to ensure that we delete only the elements in the space we own   
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
            message: "Cannot place the element outside of the boundary"
        })
    }

    await prisma.spaceElements.create({
        data: {
            elementId: parsedData.data.elementId, 
            spaceId: parsedData.data.spaceId, 
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

    const spaceElement = await prisma.spaceElements.findUnique({
        where: {
            id: parsedData.data.id
        }, 
        include: {
            space: true
        }
    })

    if(!spaceElement?.space.creatorId || spaceElement.space.creatorId !== req.userId) {
        return res.status(403).json({
            message: "Unauthorized"
        })
    }

    await prisma.spaceElements.delete({
        where: {
            id: parsedData.data.id
        }
    })

    return res.status(200).json({
        message: "Element deleted successfully"
    })
})

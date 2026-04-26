import { Router } from "express";
import { adminMiddleware } from "../../middleware/admin";
import { CreateAvatarSchema, CreateElementSchema, CreateMap, UpdateElementSchema } from "../../types";
import { prisma } from "@pixelley/db";

export const adminRouter = Router();
adminRouter.use(adminMiddleware);

adminRouter.post("/element", async (req, res) => {
    const parsedData = CreateElementSchema.safeParse(req.body);

    if(!parsedData.success) {
        return res.status(400).json({
            message: "Send valid Input"
        })
    }

    const newElement = await prisma.element.create({
        data: {
            imageUrl: parsedData.data.imageUrl,
            width: parsedData.data.width,
            height: parsedData.data.height,
            static: parsedData.data.static,
        }
    })

    return res.status(200).json({
        id: newElement.id
    })
})

adminRouter.put("/element/:elementId", async (req, res) => {
    const parsedData = UpdateElementSchema.safeParse(req.body);
    const imageId = req.params.elementId as string;

    if(!parsedData.success) {
        return res.status(400).json({
            message: "Send valid Input"
        })
    }

    await prisma.element.update({
        where: {
            id: imageId
        }, 
        data: {
            imageUrl: parsedData.data.imageUrl
        }
    })

    return res.status(200).json({
        message: "Image updated"
    })
})

adminRouter.post("/avatar", async (req, res) => {
    const parsedData = CreateAvatarSchema.safeParse(req.body);
    
    if(!parsedData.success) {
        return res.status(400).json({
            message: "Send valid Input"
        })
    }

    const newAvatar = await prisma.avatar.create({
        data: {
            name: parsedData.data.name,
            imageUrl: parsedData.data.imageUrl,
        }
    })

    return res.status(200).json({
        avatarId: newAvatar.id
    })
})

adminRouter.post("/map", async (req, res) => {
    const parsedData = CreateMap.safeParse(req.body);

    if(!parsedData.success) {
        return res.status(400).json({
            message: "Send valid Input"
        })
    }

    const newMap = await prisma.$transaction(async () => {
        // first create the map in the Map table
        const createMap = await prisma.map.create({
            data: {
                thumbnail: parsedData.data.thumbnail,
                name: parsedData.data.name,
                width: parseInt(parsedData.data.dimensions.split("x")[0]!),
                height: parseInt(parsedData.data.dimensions.split("x")[0]!),
                // We could have added the map elements here itself, but MapElements schema needs a mapId which can only be obtained after the map is created
            }
        })

        // Now add the corresponding map elements to the MapElements
        await prisma.mapElements.createMany({
            data: parsedData.data.defaultElements.map(ele => ({
                mapId: createMap.id,
                elementId: ele.elementId,
                x: ele.x,
                y: ele.y
            }))
        })

        return createMap;
    })

    return res.status(200).json({
        id: newMap.id
    })
})
import { Router } from "express";
import { userRouter } from "./user";
import { adminRouter } from "./admin";
import { spaceRouter } from "./space";
import { SigninSchema, SignupSchema } from "../../types";
import { prisma } from "@pixelley/db/prisma"
import { hash, compare } from "../../scrypt"
import jwt from "jsonwebtoken";

export const router = Router();

router.post("/signup", async (req, res) => {
    const parsedData = SignupSchema.safeParse(req.body);

    if(!parsedData.success) {
        return res.status(400).json({
            message: "Invalid Inputs for Signup"
        })
    }

    const hashedPassword = await hash(parsedData.data.password);

    try {
        console.log("hiawoien");

        console.log(parsedData.data)

        const user = await prisma.user.create({
            data: {
                username: parsedData.data.username, 
                password: hashedPassword, 
                role: parsedData.data.role             // I am using an enum here, harkirat has diff code
            }
        })

        console.log(user);

        return res.status(200).json({
            userId: user.id
        })
    } catch(e) {
        console.log(e);
        return res.status(400).json({
            message: "Username already taken"
        })
    }
})

router.post("/signin", async (req, res) => {
    const parsedData = SigninSchema.safeParse(req.body);

    if(!parsedData.success) {
        return res.status(403).json({
            message: "Enter valid username and password"
        }) 
    }

    try {
        const user = await prisma.user.findUnique({
            where: {
                username: parsedData.data.username
            }
        })

        if(!user) {
            return res.status(403).json({
                message: "Username does not exist"
            })
        }

        const isValid = compare(parsedData.data.password, user!.password);

        if(!isValid) {
            return res.status(403).json({
                message: "Invalid password"
            })
        }

        const token = jwt.sign({
            userId: user.id,
            username: parsedData.data.username, 
            role: user.role
        }, process.env.JWT_PASSWORD as string)

        return res.status(200).json({
            token
        })
    } catch(e) {
        return res.status(400).json({
            message: "Internal Server Error"
        })
    }
})

router.get("/avatars", async (req, res) => {
    const allAvatars = await prisma.avatar.findMany();

    return res.status(200).json({
        avatars: allAvatars.map(a => ({
            id: a.id, 
            name: a.name, 
            imageUrl: a.imageUrl
        }))
    })
})

router.get("/elements", async (req, res) => {
    const allElements = await prisma.element.findMany();

    return res.status(200).json({
        elements: allElements.map(ele => ({
            id: ele.id, 
            imageUrl: ele.imageUrl, 
            width: ele.width, 
            height: ele.height, 
            static: ele.static
        }))
    })
})

router.use("/user", userRouter);
router.use("/admin", adminRouter);
router.use("/space", spaceRouter);
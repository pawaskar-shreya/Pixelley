import { Router } from "express";
import { userRouter } from "./user";
import { spaceRouter } from "./space";
import { SigninSchema, SignupSchema } from "../../types";
import { prisma } from "@pixelley/db";
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
        const avatar = await prisma.avatar.findFirst({
            where: {
                gender: parsedData.data.gender
            }, 
            select: {
                id: true
            }
        })

        const user = await prisma.user.create({
            data: {
                username: parsedData.data.username, 
                password: hashedPassword, 
                gender: parsedData.data.gender,
                avatarId: avatar?.id!
            }
        })

        return res.status(200).json({
            userId: user.id
        })
    } catch(e) {
        console.log(e);
        return res.status(400).json({
            message: "Failed to create user"
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
            username: parsedData.data.username
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

// ------------ TODO: Add avatar selection

// router.get("/avatars", async (req, res) => {
//     const allAvatars = await prisma.avatar.findMany();

//     return res.status(200).json({
//         avatars: allAvatars.map(a => ({
//             id: a.id, 
//             name: a.name, 
//             imageUrl: a.imageUrl
//         }))
//     })
// })

router.use("/user", userRouter);
router.use("/space", spaceRouter);
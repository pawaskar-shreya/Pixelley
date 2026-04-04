import { Router } from "express";
import { userRouter } from "./user";
import { adminRouter } from "./admin";
import { spaceRouter } from "./space";
import { SigninSchema, SignupSchema } from "../../types";
import { json, jwt, success } from "zod";
import { prisma } from "@pixelley/db/prisma"
import bcrypt from "bcrypt";

export const router = Router();

router.post("/signup", async (req, res) => {
    const parsedData = SignupSchema.safeParse(req.body);

    if(!parsedData.success) {
        res.status(400).json({
            message: "Invalid Inputs for Signup"
        })

        return
    }

    const hashedPassword = await bcrypt.hash(parsedData.data.password, 10);

    try {
        const user = await prisma.user.create({
            data: {
                username: parsedData.data.username, 
                password: hashedPassword, 
                type: parsedData.data.type             // I am using an enum here, harkirat has diff code
            }
        })

        res.status(200).json({
            userId: user.id
        })
    } catch(e) {
        res.status(400).json({
            message: "Username already taken"
        })
    }
})

router.post("/signin", async (req, res) => {
    const parsedData = SigninSchema.safeParse(req.body);

    if(!parsedData.success) {
        res.status(403).json({
            message: "Enter valid username and password"
        })

        return 
    }

    // try {
    //     const user = await prisma.user.findUnique({
    //         where: {
    //             username: parsedData.data.username
    //         }
    //     })

    //     if(!user) {
    //         res.status(403).json({
    //             message: "Username does not exist"
    //         })
    //     }

    //     const isValid = bcrypt.compare(parsedData.data.password, user.password);

    //     if(!isValid) {
    //         res.status(403).json({
    //             message: "Invalid password"
    //         })
    //         return
    //     }

    //     const token = jwt.

    //     res.status(200).json({
    //         token: ""
    //     })
    // } catch(e) {

    // }
})

router.get("/avatars", (req, res) => {

})

router.get("/elements", (req, res) => {
    
})

router.use("/user", userRouter);
router.use("/admin", adminRouter);
router.use("/space", spaceRouter);
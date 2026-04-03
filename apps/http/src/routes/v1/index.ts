import { Router } from "express";
import { userRouter } from "./user";
import { adminRouter } from "./admin";
import { spaceRouter } from "./space";
import { SignupSchema } from "../../types";
import { success } from "zod";
// import { prisma } from "@pixelley/db"
import { prisma } from "@pixelley/db"

export const router = Router();

router.post("/signup", async (req, res) => {
    const parsedData = SignupSchema.safeParse(req.body);

    if(!parsedData.success) {
        res.json({
            message: "Invalid inputs for Signup"
        })
    }

    try {
        const user = await prisma.user.create({
            data: {
                usernmae: ""
            }
        })
    } catch(e) {

    }
})

router.post("/signin", (req, res) => {

})

router.get("/avatars", (req, res) => {

})

router.get("/elements", (req, res) => {
    
})

router.use("/user", userRouter);
router.use("/admin", adminRouter);
router.use("/space", spaceRouter);
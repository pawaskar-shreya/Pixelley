import { Router } from "express";
import { userRouter } from "./user";
import { adminRouter } from "./admin";
import { spaceRouter } from "./space";

export const router = Router();

router.post("/signup", (req, res) => {
    // const username = req.body.username;
    // const password = req.body.password;
    // const type = req.body.type;

    

    // check if username is unique - call db to do a findone
    // If unique, insert in db
    // get back a jwt and send to user
    // res.json("user created")
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
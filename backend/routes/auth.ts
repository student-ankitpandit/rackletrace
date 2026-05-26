import { Router } from 'express';
import z from 'zod';
import bcrypt from 'bcryptjs';
import jwt from "jsonwebtoken"
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../auth-middleware';

const router = Router();

router.post("/signup", async (req, res) => {
    try {
        const signupSchema =  z.object({
            name: z.string().min(3, "Name must be at least 3 characters").optional(),
            email: z.email("Invalid email address"),
            password: z.string().min(6, "Password must be at least 6 characters")
        })

        const result = signupSchema.safeParse(req.body)
        if(!result.success) {
            console.log("Validation error: ", result.error.issues)
            return res.status(400).json({success: false, errors: result.error.issues})
        }

        const {name, email, password} = result.data;
        console.log(result.data);

        const existingUser = await prisma.user.findUnique({
            where: {email}
        })

        if(existingUser) {
            return res
            .status(400)
            .json({success: false, message: "User with this email already exist"})
        }

        const hashPassword = await bcrypt.hash(password, 10)

        const user = await prisma.user.create({
            data: {
                name: name || "",
                email: email,
                password: hashPassword
            }
        })

        return res
        .status(201)
        .json({success: true, message: "Account created successfully", user: {id: user.id, email: user.email, name: user.name || ""}})
    } catch (e) {
        console.log("Error: ", e);
        return res
        .status(500)
        .json({success: false, message: "Something went wrong while creating your account"})
    }
})

router.post("/login", async (req, res) => {

    try {
        const loginSchema = z.object({
            email: z.email("Invalid email address"),
            password: z.string().min(6, "Password must be at least 6 characters")
        })


        const result = loginSchema.safeParse(req.body)
        console.log(req.body)

        if(!result.success) {
            return res
                .status(400)
                .json({
                    success: false, 
                    errors: result.error.issues
                })
        }
        

        const {email, password} = result.data
        console.log(result.data);

        
        const user = await prisma.user.findUnique({ where: {email} })

        if(!user) {
            return res
            .status(404)
            .json({success: false, message: "User not found"})
        }

        const validPassword = await bcrypt.compare(password, user.password)
        
        if(!validPassword) {
            return res
            .status(401)
            .json({success: false, message: "Invalid credentials"})
        }

        const token = jwt.sign({userId: user.id}, process.env.JWT_SECRET!)

        return res
            .status(200)
            .setHeader("Set-Cookie", `token=${token}; HttpOnly; Path=/; SameSite=Lax`)
            .json({
                success: true, 
                message: "User logged in successfully", 
                token: token, 
                userId: user.id
            })
        
    } catch (e) {
        console.log("Error: ", e)
        return res.status(500).json({success: false, message: "Something went wrong while signing you in"})
    }
})

router.post("/logout", async(req, res) => {
    try {
        res.setHeader("Set-Cookie", "token=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0");

        return res.status(200).json({ success: true, message: "Logged out successfully." });
    } catch (error) {
        console.log("Error clearing cookie: ", error);
        return res.status(500).json({ success: false, message: "Could not log out. Please try again." });
    }

})

router.get("/me", authMiddleware, async (req, res) => {
    const userId = req.userId;

    if(!userId) {
        res.status(401).json({
            success: false,
            message: "UserId not found"
        })
        return
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })

    if(!user) {
        res.status(401).json({
            success: false, 
            message: "Unauthorized"
        }); 
        return
    }

    res.json({
        user: {
            id: user?.id,
            email: user?.email
        }
    })

})


export default router
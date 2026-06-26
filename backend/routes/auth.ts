import type { Request, Response } from 'express';
import { Router } from 'express';
import z from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../auth-middleware';

const router = Router();

const signupSchema = z.object({
    name: z.string().optional(),
    email: z.email({ error: "Invalid email address" }),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

const loginSchema = z.object({
    email: z.email({ error: "Invalid email address" }),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

// POST /auth/signup
router.post("/signup", async (req: Request, res: Response) => {
    try {
        const result = signupSchema.safeParse(req.body);
        if (!result.success) {
            res.status(400).json({ success: false, errors: result.error.issues });
            return;
        }

        const { name = "", email, password } = result.data;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            res.status(400).json({ success: false, message: "User with this email already exists" });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name: name ?? "",
                email,
                password: hashedPassword,
            },
        });

        res.status(201).json({
            success: true,
            message: "Account created successfully",
            user: { id: user.id, email: user.email, name: user.name ?? "" },
        });
    } catch (e) {
        console.error("Signup error:", e);
        res.status(500).json({ success: false, message: "Something went wrong while creating your account" });
    }
});

// POST /auth/login
router.post("/login", async (req: Request, res: Response) => {
    try {
        const result = loginSchema.safeParse(req.body);
        if (!result.success) {
            res.status(400).json({ success: false, errors: result.error.issues });
            return;
        }

        const { email, password } = result.data;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            res.status(404).json({ success: false, message: "User not found" });
            return;
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            res.status(401).json({ success: false, message: "Invalid credentials" });
            return;
        }

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!);

        res.status(200)
            .setHeader("Set-Cookie", `token=${token}; HttpOnly; Path=/; SameSite=Lax`)
            .json({
                success: true,
                message: "Logged in successfully",
                token,
                userId: user.id,
            });
    } catch (e) {
        console.error("Login error:", e);
        res.status(500).json({ success: false, message: "Something went wrong while signing you in" });
    }
});

// POST /auth/logout
router.post("/logout", async (_req: Request, res: Response) => {
    try {
        res.setHeader("Set-Cookie", "token=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0");
        res.status(200).json({ success: true, message: "Logged out successfully" });
    } catch (e) {
        console.error("Logout error:", e);
        res.status(500).json({ success: false, message: "Could not log out. Please try again." });
    }
});

// GET /auth/me
router.get("/me", authMiddleware, async (req: Request, res: Response) => {
    const userId = req.userId;

    if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
    }

    res.json({
        success: true,
        user: { id: user.id, email: user.email, name: user.name },
    });
});

export default router;

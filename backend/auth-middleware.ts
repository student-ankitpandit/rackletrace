import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import prisma from "./lib/prisma";

interface authenticatedRequest extends Request {
    userId: string;
}

interface customJWTPayload extends JwtPayload {
    userId: string
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    // Try cookie first (browser dashboard), then Authorization header (SDK / API key)
    const cookieToken: string | undefined = req.cookies?.token;
    const headerToken = req.headers.authorization?.split(' ')[1];
    const authToken = cookieToken ?? headerToken;

    if(!authToken) {
        res.status(403).send({
            message: "Auth token invalid",
            success: false,
        })
        return;
    }

    // If the token starts with "rk_", treat it as an API key
    if (authToken.startsWith("rk_")) {
        try {
            const apiKey = await prisma.apiKey.findUnique({ where: { key: authToken } });
            if (!apiKey) {
                res.status(403).json({ message: "Invalid API key", success: false });
                return;
            }
            (req as authenticatedRequest).userId = apiKey.userId;

            // Update lastUsedAt in background (non-blocking)
            prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } }).catch(() => {});

            next();
            return;
        } catch {
            res.status(403).json({ message: "API key validation failed", success: false });
            return;
        }
    }

    // Otherwise treat it as a JWT
    try {
        const decodedData = jwt.verify(authToken, process.env.JWT_SECRET!);
        // console.log(data);
        (req as authenticatedRequest).userId = (decodedData as unknown as customJWTPayload).userId as unknown as string;

        next();

        
    } catch (e) {
        res.status(403).json({
            message: "Auth token invalid",
            success: false,
        });
    }
}

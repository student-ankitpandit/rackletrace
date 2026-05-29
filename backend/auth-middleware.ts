import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

interface authenticatedRequest extends Request {
    userId: string;
}

interface customJWTPayload extends JwtPayload {
    userId: string
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
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

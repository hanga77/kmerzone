
import jwt from 'jsonwebtoken';
// FIX: import Request, Response, NextFunction types from express
import type { Request, Response, NextFunction } from 'express';
import { exit } from 'process';
import type { User } from '../types';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.error("JWT_SECRET is not defined in .env file.");
    exit(1);
}

export const generateToken = (user: User & { _id: any }) => {
    const userForToken = { ...user, id: user._id.toHexString() };
    delete (userForToken as any).password;
    delete (userForToken as any)._id;
    return jwt.sign({ user: userForToken }, JWT_SECRET!, { expiresIn: '1d' });
};

// FIX: Added explicit types for req, res, and next
export const protectRoute = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET!, (err: any, user: any) => {
        if (err) return res.sendStatus(403);
        (req as any).user = user;
        next();
    });
};

// FIX: Added explicit types for req, res, and next
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user?.user;
    if (user && user.role === 'superadmin') {
        next();
    } else {
        res.status(403).json({ message: 'Forbidden: Admin access required' });
    }
};

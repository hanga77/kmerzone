

import jwt from 'jsonwebtoken';
// FIX: Use default import for express to avoid type conflicts.
import express from 'express';
// FIX: Added explicit type imports for express handlers to resolve property not found errors on req and res.
// Removed to use explicit express.Request/Response to avoid type conflicts
// import type { Request, Response, NextFunction } from 'express';
import type { User } from '../types';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.error("JWT_SECRET is not defined in .env file.");
    process.exit(1);
}

export const generateToken = (user: User & { _id: any }) => {
    const userForToken = { ...user, id: user._id.toHexString() };
    delete (userForToken as any).password;
    delete (userForToken as any)._id;
    return jwt.sign({ user: userForToken }, JWT_SECRET!, { expiresIn: '1d' });
};

// FIX: Correctly typed req, res, and next parameters using fully qualified express types.
export const protectRoute = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET!, (err: any, user: any) => {
        if (err) return res.sendStatus(403);
        (req as any).user = user;
        next();
    });
};

// FIX: Correctly typed req, res, and next parameters using fully qualified express types.
export const isAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = (req as any).user?.user;
    if (user && user.role === 'superadmin') {
        next();
    } else {
        res.status(403).json({ message: 'Forbidden: Admin access required' });
    }
};

// FIX: Correctly typed req, res, and next parameters using fully qualified express types.
export const isLogisticsAgent = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = (req as any).user?.user;
    if (user && ['delivery_agent', 'depot_agent', 'depot_manager'].includes(user.role)) {
        next();
    } else {
        res.status(403).json({ message: 'Forbidden: Logistics access required' });
    }
};

// FIX: Correctly typed req, res, and next parameters using fully qualified express types.
export const isDepotManager = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = (req as any).user?.user;
    if (user && user.role === 'depot_manager') {
        next();
    } else {
        res.status(403).json({ message: 'Forbidden: Depot Manager access required' });
    }
};
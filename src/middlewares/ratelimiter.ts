import expressRateLimit from 'express-rate-limit';

export const createRatelimiter = (seconds: number, message?: string, maxReq?: number): expressRateLimit.RateLimit => expressRateLimit({
    windowMs: seconds * 1000,
    max: maxReq || 3,
    message: message || `Too many requests. Please retry in ${seconds} seconds.`,
    keyGenerator: (req) => req.jwt
});

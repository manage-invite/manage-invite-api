import { NextFunction, Response } from "express";
import { replyError } from "..";

export default (req: Request, res: Response, next: NextFunction): void => {

    const apiKey = req.headers.get('authorization')
    if (!apiKey) return replyError(403, 'Missing Authorization header', res);

    next();

};

import { DecodedUserJWT, DecodedGuildJWT, decodeJWT } from '../utils/jwt'
import { NextFunction, Response, Request } from "express";
import { replyError } from "..";

export default (req: Request, res: Response, next: NextFunction): void => {

    const apiKey = req.headers['authorization']
    if (!apiKey) return replyError(403, 'Missing Authorization header', res);

    if (apiKey.startsWith('Dash')) {
        const key = apiKey.slice(5, apiKey.length);
        const data = decodeJWT(key) as DecodedUserJWT|null;
        if (!data) return replyError(403, 'Unauthorized. User JWT can not be verified.', res);
        req.jwt = key;
        req.jwtType = 'user';
        req.decodedJWT = data;
    }

    else if (apiKey.startsWith('Guild')) {
        const key = apiKey.slice(6, apiKey.length);
        const data = decodeJWT(key) as DecodedGuildJWT|null;
        if (!data) return replyError(403, 'Unauthorized. Guild JWT can not be verified.', res);
        req.jwt = key;
        req.jwtType = 'guild';
        req.decodedJWT = data;
    }

    next();

};

import { DecodedUserJWT, DecodedGuildJWT, decodeJWT } from '../utils/jwt'
import { NextFunction, Response, Request } from "express";
import { replyError } from "..";

export default (req: Request, res: Response, next: NextFunction): void => {

    const apiKey = req.headers['authorization']
    if (!apiKey) return replyError(403, 'Missing Authorization header', res);

    const key = apiKey.slice('Bearer '.length);
    const data = decodeJWT(key) as DecodedUserJWT|DecodedGuildJWT;
    if (!data) return replyError(403, 'Unauthorized. JWT can not be verified.', res);
    req.jwt = key;
    req.jwtType = data.type;
    req.decodedJWT = data;
    
    next();

};

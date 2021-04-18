import { NextFunction, Response, Request } from "express";
import { replyError } from "..";
import { verifyPermissions } from "../ipc-server";

export default async (req: Request, res: Response, next: NextFunction): Promise<void> => {

    const guildID = req.params.guildID;

    if (req.jwtType === 'guild') {
        if (req.decodedJWT.guildID !== guildID) return replyError(403, 'Unauthorized', res);
    } else if (req.jwtType === 'user') {
        const verifiedGuilds = await verifyPermissions(req.decodedJWT.userID, 'MANAGE_GUILD', [ req.params.guildID ]);
        if (!verifiedGuilds.some((verifiedGuildID) => verifiedGuildID === guildID)) return replyError(403, 'Unauthorized', res);
    }

    next();

};

import { NextFunction, Response, Request } from "express";
import { replyError } from "..";
import { verifyPermissions } from "../ipc-server";
import database from '../database';

export default async (req: Request, res: Response, next: NextFunction): Promise<void> => {

    const guildID = req.params.guildID;

    if (req.jwtType === 'guild') {
        const guildAPIToken = await database.fetchGuildAPIToken(guildID);
        if (req.decodedJWT.guildID !== guildID) return replyError(403, 'Unauthorized. Guild JWT does not have access to this guild.', res);
        if (guildAPIToken !== guildID) return replyError(403, 'Unauthorized. Guild JWT has been revoked.', res);
    } else if (req.jwtType === 'user') {
        const verifiedGuilds = await verifyPermissions(req.decodedJWT.userID, 'MANAGE_GUILD', [ req.params.guildID ]);
        if (!verifiedGuilds.some((verifiedGuildID) => verifiedGuildID === guildID)) return replyError(403, 'Unauthorized. User does not have access to this guild.', res);
    }

    next();

};

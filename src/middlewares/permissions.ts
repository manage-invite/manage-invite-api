import { NextFunction, Response, Request } from 'express';
import { replyError } from '..';
import { verifyPermissions } from '../ipc-server';
import database from '../database';
import { DISCORD_ID_REGEX } from '../utils/constants';

export default async (req: Request, res: Response, next: NextFunction): Promise<void> => {

    const guildID = req.params.guildID;
    if (!DISCORD_ID_REGEX.test(guildID)) return replyError(400, 'Guild ID can not be verified.', res);

    if (req.jwtType === 'guild') {
        const guildAPIToken = await database.fetchGuildAPIToken(guildID as `${bigint}`);
        if (req.decodedJWT.guildID !== guildID) return replyError(403, 'Unauthorized. Guild JWT does not have access to this guild.', res);
        if (guildAPIToken !== req.jwt) return replyError(403, 'Unauthorized. Guild JWT has been revoked.', res);
    } else if (req.jwtType === 'user') {
        const verifiedGuilds = await verifyPermissions(req.decodedJWT.userID, 32n, [ req.params.guildID ]);
        if (!verifiedGuilds.some((verifiedGuildID) => verifiedGuildID === guildID)) return replyError(403, 'Unauthorized. User does not have access to this guild.', res);
    }

    next();

};

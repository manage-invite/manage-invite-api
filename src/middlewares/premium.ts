import { NextFunction, Response, Request } from "express";
import { replyError } from "..";
import database from '../database';

export default async (req: Request, res: Response, next: NextFunction): Promise<void> => {

    const guildID = req.params.guildID;

    const guildSubscriptions = await database.fetchGuildSubscriptions(guildID);
    const isPremium = guildSubscriptions.some((sub) => new Date(sub.expiresAt).getTime() > (Date.now()-3*24*60*60*1000));
    if (!isPremium) return replyError(403, 'Unauthorized. Guild does not have any active subscription. Purchase one to get access to the API!', res);

    next();

};

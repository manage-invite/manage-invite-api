import { Router } from 'express';
import fetch from 'node-fetch';

import { replyError } from '../';
import { verifyGuilds, verifyPermissions } from '../ipc-server';
import database from '../database';
import auth from '../middlewares/auth';
import { wait } from '../utils/functions';
import { createRatelimiter } from '../middlewares/ratelimiter';

import { waitingVerification } from './paypal.routes';

const userRouter = Router();

interface GuildObject {
    id: string;
    icon: string;
    permissions: number;
}

userRouter.get('/guilds', auth, createRatelimiter(5, undefined, 2), async (req, res) => {

    if (req.jwtType !== 'user') return replyError(400, 'Only user can get guilds', res);

    let guildsData: GuildObject[]|undefined;
    while (!guildsData) {
        const guildsResponse = await fetch('https://discordapp.com/api/users/@me/guilds', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${req.decodedJWT.accessToken}`
            }
        });
        const fetchedGuildsData = await guildsResponse.json();
        if (fetchedGuildsData.retry_after) await wait(fetchedGuildsData.retry_after || 3000);
        else {
            guildsData = fetchedGuildsData as GuildObject[];
        }
    }

    const guildPremiumStatuses = await database.fetchGuildsPremiumStatuses(guildsData.map((guild: GuildObject) => guild.id));
    const verifiedAdminGuildIDs = await verifyPermissions(req.decodedJWT.userID, 'MANAGE_GUILD', guildsData.map((guildData) => guildData.id));
    const verifiedAddedGuilds = await verifyGuilds(guildsData.map((guild) => guild.id));

    return res.send(guildsData.map((guildData) => ({
        ...guildData,
        isAdmin: verifiedAdminGuildIDs.some((verifiedAdminGuildID) => verifiedAdminGuildID === guildData.id),
        isTrial: guildPremiumStatuses.find((s) => s.guildID === guildData.id)?.isTrial,
        isPremium: guildPremiumStatuses.find((s) => s.guildID === guildData.id)?.isPremium,
        isAdded: verifiedAddedGuilds.includes(guildData.id),
        isWaitingVerification: waitingVerification.has(guildData.id),
        iconURL: guildData.icon ? `https://cdn.discordapp.com/icons/${guildData.id}/${guildData.icon}.webp` : null
    })));

});

export default userRouter;

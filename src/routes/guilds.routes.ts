import { Router } from 'express';
import database from '../database';
import { replyData } from '..';

const guildsRouter = Router();

guildsRouter.get('/:guildID/settings', async (req, res) => {

    const guildID = req.params.guildID;
    const guildSettings = await database.fetchGuildSettings(guildID);

    replyData(guildSettings, req, res);

});

guildsRouter.get('/:guildID/blacklisted', async (req, res) => {

    const guildID = req.params.guildID;
    const guildBlacklistedUsers = await database.fetchGuildBlacklistedUsers(guildID);

    res.send({
        error: false,
        data: guildBlacklistedUsers
    });

});

export default guildsRouter;

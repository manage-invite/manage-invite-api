import { Request, Response, Router } from 'express';
import database from '../database';
import { replyData, replyError } from '../';
import auth from '../middlewares/auth';
import permissions from '../middlewares/permissions';
import { checkSchema } from 'express-validator';
import availableLanguages from '../languages.json';
import { getChannelsOf } from '../ipc-server';

const guildsRouter = Router();

guildsRouter.get('/:guildID/channels', auth, permissions, async (req, res) => {
    
    const guildID = req.params.guildID;
    const channels = await getChannelsOf(guildID);

    replyData(channels, req, res);
    
});

guildsRouter.get('/:guildID/settings', auth, permissions, async (req, res) => {

    const guildID = req.params.guildID;
    const guildSettings = await database.fetchGuildSettings(guildID);

    replyData(guildSettings, req, res);

});

guildsRouter.post('/:guildID/settings', checkSchema({
    prefix: {
        in: 'body',
        isString: true,
        isLength: {
            errorMessage: 'Prefix should be at least one character and 10 characters max',
            options: {
                min: 1,
                max: 10
            }
        },
        optional: true
    },
    language: {
        in: 'body',
        isString: true,
        custom: {
            options: (value) => availableLanguages.some((l) => l.name === value)
        },
        optional: true
    },
    cmdChannel: {
        in: 'body',
        isString: true,
        matches: {
            options: /^([0-9]{12,32})$/
        },
        optional: true
    }
}), auth, permissions, async (req: Request, res: Response) => {

    if (!req.body) return replyError(400, 'Missing body', res);

    const guildID = req.params.guildID;
    const guildSettings = await database.fetchGuildSettings(guildID);

    if (Object.prototype.hasOwnProperty.call(req.body, 'prefix') && guildSettings.prefix !== req.body.prefix) await database.updateGuildSetting(guildID, 'prefix', req.body.prefix);
    if (Object.prototype.hasOwnProperty.call(req.body, 'language') && guildSettings.language !== req.body.language) await database.updateGuildSetting(guildID, 'language', req.body.language);
    if (Object.prototype.hasOwnProperty.call(req.body, 'cmdChannel') && guildSettings.cmdChannel !== req.body.cmdChannel) await database.updateGuildSetting(guildID, 'cmdChannel', req.body.cmdChannel);

    const newGuildSettings = await database.fetchGuildSettings(guildID);
    
    replyData(newGuildSettings, req, res);

});

guildsRouter.get('/:guildID/blacklisted', auth, permissions, async (req, res) => {

    const guildID = req.params.guildID;
    const guildBlacklistedUsers = await database.fetchGuildBlacklistedUsers(guildID);

    res.send({
        error: false,
        data: guildBlacklistedUsers
    });

});

export default guildsRouter;

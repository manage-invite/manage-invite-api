import { Request, Response, Router } from 'express';
import database from '../database';
import { replyData, replyError } from '../';
import auth from '../middlewares/auth';
import permissions from '../middlewares/permissions';
import { checkSchema, validationResult } from 'express-validator';
import availableLanguages from '../languages.json';
import { getChannelsOf } from '../ipc-server';
import { generateGuildJWT } from '../utils/jwt';

const guildsRouter = Router();

guildsRouter.get('/:guildID/jwt', auth, permissions, async (req, res) => {

    const guildID = req.params.guildID;
    const token = await database.fetchGuildAPIToken(guildID);

    return replyData({
        token
    }, req, res);

});

guildsRouter.post('/:guildID/jwt', auth, permissions, async (req, res) => {

    if (req.jwtType === 'guild') return replyError(403, 'Only user JWTs are allowed for this route.', res);
    
    const guildID = req.params.guildID;

    const newToken = generateGuildJWT(guildID);
    await database.updateGuildAPIToken(guildID, newToken, req.decodedJWT.userID, new Date());
    const token = await database.fetchGuildAPIToken(guildID);

    return replyData({
        token
    }, req, res);

});

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
        optional: {
            options: {
                nullable: true
            }
        }
    }
}), auth, permissions, async (req: Request, res: Response) => {
    
    const err = validationResult(req);
    if (!err.isEmpty()) {
        const errors = err.mapped();
        const msg = errors[Object.keys(errors)[0]].msg;
        return replyError(400, msg, res);
    }

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

    replyData(guildBlacklistedUsers, req, res);

});

guildsRouter.get('/:guildID/plugins', auth, permissions, async (req, res) => {

    const guildID = req.params.guildID;
    const guildPlugins = await database.fetchGuildPlugins(guildID);

    replyData(guildPlugins, req, res);

});

guildsRouter.post('/:guildID/plugins/:pluginName', checkSchema({
    enabled: {
        in: 'body',
        isBoolean: true
    },
    channel: {
        in: 'body',
        isString: true,
        matches: {
            options: /^([0-9]{12,32})$/
        }
    },
    mainMessage: {
        in: 'body',
        isString: true,
        isLength: {
            options: { min: 1, max: 1900 }
        }
    },
    vanityMessage: {
        in: 'body',
        isString: true,
        isLength: {
            options: { min: 1, max: 1900 }
        }
    },
    oauth2Message: {
        in: 'body',
        isString: true,
        isLength: {
            options: { min: 1, max: 1900 }
        },
        optional: true
    },
    unknownMessage: {
        in: 'body',
        isString: true,
        isLength: {
            options: { min: 1, max: 1900 }
        }
    }
}), auth, permissions, async (req: Request, res: Response) => {
    
    const err = validationResult(req);
    if (!err.isEmpty()) {
        const errors = err.mapped();
        const msg = errors[Object.keys(errors)[0]].msg;
        return replyError(400, msg, res);
    }

    const guildID = req.params.guildID;
    const pluginName = req.params.pluginName;
    
    await database.updateGuildPlugin(guildID, pluginName, {
        enabled: req.body.enabled,
        channel: req.body.channel,
        mainMessage: req.body.mainMessage,
        vanityMessage: req.body.vanityMessage,
        unknownMessage: req.body.unknownMessage,
        ...(pluginName !== 'joinDM' ? ({
            oauth2Message: req.body.oauth2Message
        }) : {})
    });

    const plugins = await database.fetchGuildPlugins(guildID);

    replyData(plugins, req, res);

});

guildsRouter.get('/:guildID/subscriptions', auth, permissions, async (req, res) => {

    const guildID = req.params.guildID;
    const guildSubscriptions = await database.fetchGuildSubscriptions(guildID);

    replyData(guildSubscriptions, req, res);

});

export default guildsRouter;

import { Router, Request, Response } from "express";

/* Middlewares */
import auth from "../../middlewares/auth";
import permissions from "../../middlewares/permissions";
import premium from "../../middlewares/premium";

/* Helpers */
import database from '../../database';
import { replyData, replyError } from "../..";
import { checkSchema, validationResult } from "express-validator";
import { DISCORD_ID_REGEX } from "../../utils/constants";

export default (guildsRouter: Router): void => {

    guildsRouter.get('/:guildID/plugins', auth, permissions, premium, async (req, res) => {

        const guildID = req.params.guildID;
        const guildPlugins = await database.fetchGuildPlugins(guildID);
    
        replyData(guildPlugins, req, res);
    
    });
    
    guildsRouter.post('/:guildID/plugins/:pluginName', auth, permissions, premium, checkSchema({
        enabled: {
            in: 'body',
            isBoolean: true
        },
        channel: {
            in: 'body',
            isString: true,
            matches: {
                options: DISCORD_ID_REGEX
            },
            optional: true
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
    }), async (req: Request, res: Response) => {
        
        const err = validationResult(req);
        if (!err.isEmpty()) {
            const errors = err.mapped();
            const msg = errors[Object.keys(errors)[0]].msg;
            return replyError(400, msg, res);
        }
    
        const guildID = req.params.guildID;
        const pluginName = req.params.pluginName;
    
        // TODO: add this to express validator
        if (pluginName !== 'joinDM' && !req.body.channel) {
            return replyError(400, 'Invalid value', res);
        }
        
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

}
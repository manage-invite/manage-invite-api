import { Router, Request, Response } from "express";

/* Middlewares */
import auth from "../../middlewares/auth";
import permissions from "../../middlewares/permissions";
import premium from "../../middlewares/premium";
import { createRatelimiter } from "../../middlewares/ratelimiter";

/* Helpers */
import database from '../../database';
import { replyData, replyError } from "../..";
import { checkSchema, validationResult } from "express-validator";
import availableLanguages from '../../languages.json';
import { DISCORD_ID_REGEX } from "../../utils/constants";

export default (guildsRouter: Router): void => {

    guildsRouter.get('/:guildID/settings', auth, createRatelimiter(3, undefined, 5), permissions, premium, async (req, res) => {

        const guildID = req.params.guildID;
        const guildSettings = await database.fetchGuildSettings(guildID);
    
        replyData(guildSettings, req, res);
    
    });
    
    guildsRouter.post('/:guildID/settings', auth, createRatelimiter(3, undefined, 5), permissions, premium, checkSchema({
        storageID: {
            in: 'body',
            isString: true,
            optional: true
        },
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
            withMessage: {
                options: 'Guild prefix is not valid'
            },
            optional: true
        },
        language: {
            in: 'body',
            isString: true,
            custom: {
                options: (value) => availableLanguages.some((l) => l.name === value)
            },
            withMessage: {
                options: 'Guild language is not valid'
            },
            optional: true
        },
        cmdChannel: {
            in: 'body',
            isString: true,
            matches: {
                options: DISCORD_ID_REGEX
            },
            withMessage: {
                options: 'Command channel is not valid'
            },
            optional: {
                options: {
                    checkFalsy: false,
                    nullable: true
                }
            }
        },
        fakeThreshold: {
            in: 'body',
            isInt: {
                options: {
                    gt: 0
                }
            },
            optional: {
                options: {
                    nullable: true
                }
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
        const guildSettings = await database.fetchGuildSettings(guildID);
    
        if (Object.prototype.hasOwnProperty.call(req.body, 'prefix') && guildSettings.prefix !== req.body.prefix) await database.updateGuildSetting(guildID, 'prefix', req.body.prefix);
        if (Object.prototype.hasOwnProperty.call(req.body, 'language') && guildSettings.language !== req.body.language) await database.updateGuildSetting(guildID, 'language', req.body.language);
        if (Object.prototype.hasOwnProperty.call(req.body, 'cmdChannel') && guildSettings.cmdChannel !== req.body.cmdChannel) await database.updateGuildSetting(guildID, 'cmdChannel', req.body.cmdChannel);
        if (Object.prototype.hasOwnProperty.call(req.body, 'fakeThreshold') && guildSettings.fakeThreshold !== req.body.fakeThreshold) await database.updateGuildSetting(guildID, 'fakeThreshold', req.body.fakeThreshold);
    
        if (Object.prototype.hasOwnProperty.call(req.body, 'storageID') && guildSettings.storageID !== req.body.storageID) {
            const guildStorages = await database.fetchGuildStorages(guildID);
            if (!guildStorages.some((storage) => storage.storageID === req.body.storageID)) {
                return replyError(400, 'Storage with this ID can not be found.', res);
            } else {
                await database.updateGuildSetting(guildID, 'storageID', req.body.storageID);
            }
        }
    
        const newGuildSettings = await database.fetchGuildSettings(guildID);
        
        replyData(newGuildSettings, req, res);
    
    });

}
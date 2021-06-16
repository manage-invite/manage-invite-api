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


    guildsRouter.get('/:guildID/alerts', auth, permissions, premium, async (req, res) => {

        const guildID = req.params.guildID;
        const guildAlerts = await database.fetchGuildAlerts(guildID);
    
        replyData(guildAlerts, req, res);
    
    });
    
    guildsRouter.post('/:guildID/alerts', auth, permissions, premium, checkSchema({
        message: {
            in: 'body',
            isString: true
        },
        channelID: {
            in: 'body',
            isString: true,
            matches: {
                options: DISCORD_ID_REGEX
            }
        },
        inviteCount: {
            in: 'body',
            isInt: {
                options: {
                    min: 1,
                    max: 99999
                }
            }
        },
        up: {
            in: 'body',
            isBoolean: true
        },
        down: {
            in: 'body',
            isBoolean: true
        }
    }), async (req: Request, res: Response) => {
    
        const err = validationResult(req);
        if (!err.isEmpty()) {
            const errors = err.mapped();
            const msg = errors[Object.keys(errors)[0]].msg;
            return replyError(400, msg, res);
        }
    
        const guildID = req.params.guildID;

        const { inviteCount, channelID, up, down, message } = req.body;
    
        const guildAlerts = await database.fetchGuildAlerts(guildID);
        if (guildAlerts.some((alert) => alert.inviteCount === inviteCount)) return replyError(400, 'There is already an alert for this invite count', res);
    
        await database.addGuildAlert(guildID, inviteCount, channelID, message, up, down);
    
        const newGuildAlerts = await database.fetchGuildAlerts(guildID);
    
        replyData(newGuildAlerts, req, res);

    });
    
    guildsRouter.delete('/:guildID/alerts/:inviteCount', auth, permissions, premium, checkSchema({
        inviteCount: {
            in: 'params',
            isInt: true
        }
    }), async (req: Request, res: Response) => {
    
        const err = validationResult(req);
        if (!err.isEmpty()) {
            const errors = err.mapped();
            const msg = errors[Object.keys(errors)[0]].msg;
            return replyError(400, msg, res);
        }
    
        const guildID = req.params.guildID;
        const inviteCount = parseInt(req.params.inviteCount);
    
        const guildAlerts = await database.fetchGuildAlerts(guildID);
        const guildAlert = guildAlerts.find((alert) => alert.inviteCount === inviteCount);
        if (!guildAlert) return replyError(400, 'There is no alert with that invite count.', res);
    
        if (Object.prototype.hasOwnProperty.call(req.body, 'message') && guildAlert.message !== req.body.message) await database.updateGuildAlert(guildID, inviteCount, 'message', req.body.message);
        if (Object.prototype.hasOwnProperty.call(req.body, 'channelID') && guildAlert.channelID !== req.body.channelID) await database.updateGuildAlert(guildID, inviteCount, 'channelID', req.body.channelID);
        if (Object.prototype.hasOwnProperty.call(req.body, 'up') && guildAlert.up !== req.body.up) await database.updateGuildAlert(guildID, inviteCount, 'up', req.body.up);
        if (Object.prototype.hasOwnProperty.call(req.body, 'down') && guildAlert.down !== req.body.down) await database.updateGuildAlert(guildID, inviteCount, 'down', req.body.down);

        const newGuidlAlerts = await database.fetchGuildAlerts(guildID);
    
        replyData(newGuidlAlerts, req, res);
    
    });

    guildsRouter.post('/:guildID/alerts/:inviteCount', auth, permissions, premium, checkSchema({
        inviteCount: {
            in: 'params',
            isInt: true
        },
        message: {
            in: 'body',
            isString: true,
            optional: true
        },
        channelID: {
            in: 'body',
            isString: true,
            optional: true,
            matches: {
                options: DISCORD_ID_REGEX
            }
        },
        up: {
            in: 'body',
            isBoolean: true,
            optional: true
        },
        down: {
            in: 'body',
            isBoolean: true,
            optional: true
        }
    }), async (req: Request, res: Response) => {
    
        const err = validationResult(req);
        if (!err.isEmpty()) {
            const errors = err.mapped();
            const msg = errors[Object.keys(errors)[0]].msg;
            return replyError(400, msg, res);
        }
    
        const guildID = req.params.guildID;
        const inviteCount = parseInt(req.params.inviteCount);
    
        const guildAlerts = await database.fetchGuildAlerts(guildID);
        if (!guildAlerts.some((alert) => alert.inviteCount === inviteCount)) return replyError(400, 'There is no alert with that invite count.', res);
    
    
        const newGuidlAlerts = await database.fetchGuildAlerts(guildID);
    
        replyData(newGuidlAlerts, req, res);

    });

}
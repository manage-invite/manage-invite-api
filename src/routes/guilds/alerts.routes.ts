import { Router, Request, Response } from 'express';

/* Middlewares */
import auth from '../../middlewares/auth';
import permissions from '../../middlewares/permissions';
import premium from '../../middlewares/premium';

/* Helpers */
import database from '../../database';
import { replyData, replyError } from '../..';
import { checkSchema, validationResult } from 'express-validator';
import { DISCORD_ID_REGEX } from '../../utils/constants';

export default (guildsRouter: Router): void => {


    guildsRouter.get('/:guildID/alerts', auth, permissions, premium, async (req, res) => {

        const guildID = req.params.guildID;
        const guildAlerts = await database.fetchGuildAlerts(guildID as `${bigint}`);

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
        type: {
            in: 'body',
            isString: true,
            isIn: {
                options: [['up', 'down']]
            }
        }
    }), async (req: Request, res: Response) => {

        const err = validationResult(req);
        if (!err.isEmpty()) {
            const errors = err.mapped();
            const msg = errors[Object.keys(errors)[0]].msg;
            return replyError(400, msg, res);
        }

        const guildID = req.params.guildID as `${bigint}`;

        const { inviteCount, channelID, type, message } = req.body;

        const guildAlerts = await database.fetchGuildAlerts(guildID);
        if (guildAlerts.some((alert) => alert.inviteCount === inviteCount && alert.type === type)) return replyError(400, 'There is already an alert for this invite count', res);

        await database.addGuildAlert(guildID, inviteCount, channelID, message, type);

        const newGuildAlerts = await database.fetchGuildAlerts(guildID);

        replyData(newGuildAlerts, req, res);

    });

    guildsRouter.post('/:guildID/alerts/:alertID', auth, permissions, premium, checkSchema({
        alertID: {
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
            matches: {
                options: DISCORD_ID_REGEX
            },
            optional: true
        },
        inviteCount: {
            in: 'body',
            isInt: {
                options: {
                    min: 1,
                    max: 99999
                }
            },
            optional: true
        },
        type: {
            in: 'body',
            isString: true,
            isIn: {
                options: [['up', 'down']]
            },
            optional: true
        }
    }), async (req: Request, res: Response) => {

        const err = validationResult(req);
        if (!err.isEmpty()) {
            const errors = err.mapped();
            const msg = errors[Object.keys(errors)[0]].msg;
            return replyError(400, msg, res);
        }

        const guildID = req.params.guildID as `${bigint}`;
        const alertID = parseInt(req.params.alertID);

        const guildAlerts = await database.fetchGuildAlerts(guildID);
        const guildAlert = guildAlerts.find((alert) => alert.id === alertID);
        if (!guildAlert) return replyError(404, 'There is no alert with that ID', res);

        const duplicatedAlert = guildAlerts.some((alert) => alert.id !== alertID && alert.inviteCount === (req.body.inviteCount || guildAlert.inviteCount) && alert.type === (req.body.type || guildAlert.type));
        if (duplicatedAlert) return replyError(400, 'There is already an alert with these parameters', res);

        if (Object.prototype.hasOwnProperty.call(req.body, 'inviteCount') && guildAlert.inviteCount !== req.body.inviteCount) await database.updateGuildAlert(guildID, alertID, 'inviteCount', req.body.inviteCount);
        if (Object.prototype.hasOwnProperty.call(req.body, 'message') && guildAlert.message !== req.body.message) await database.updateGuildAlert(guildID, alertID, 'message', req.body.message);
        if (Object.prototype.hasOwnProperty.call(req.body, 'channelID') && guildAlert.channelID !== req.body.channelID) await database.updateGuildAlert(guildID, alertID, 'channelID', req.body.channelID);
        if (Object.prototype.hasOwnProperty.call(req.body, 'alert_type') && guildAlert.type !== req.body.type) await database.updateGuildAlert(guildID, alertID, 'alert_type', req.body.type);

        const newGuidlAlerts = await database.fetchGuildAlerts(guildID);

        replyData(newGuidlAlerts, req, res);

    });

    guildsRouter.delete('/:guildID/alerts/:alertID', auth, permissions, premium, checkSchema({
        alertID: {
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

        const guildID = req.params.guildID as `${bigint}`;
        const alertID = parseInt(req.params.alertID);

        const guildAlerts = await database.fetchGuildAlerts(guildID);
        if (!guildAlerts.some((alert) => alert.id === alertID)) return replyError(400, 'There is no alert with that ID', res);

        await database.removeGuildAlert(guildID, alertID);

        const newGuidlAlerts = await database.fetchGuildAlerts(guildID);

        replyData(newGuidlAlerts, req, res);

    });

};

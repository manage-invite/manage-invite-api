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


    guildsRouter.get('/:guildID/blacklisted', auth, permissions, premium, async (req, res) => {

        const guildID = req.params.guildID as `${bigint}`;
        const guildBlacklistedUsers = await database.fetchGuildBlacklistedUsers(guildID);

        replyData(guildBlacklistedUsers, req, res);

    });

    guildsRouter.post('/:guildID/blacklisted/:userID', auth, permissions, premium, checkSchema({
        userID: {
            in: 'params',
            isString: true,
            matches: {
                options: DISCORD_ID_REGEX
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
        const userID = req.params.userID;

        const blacklistedUsers = await database.fetchGuildBlacklistedUsers(guildID);
        if (blacklistedUsers.includes(userID)) return replyError(400, 'This user is already blacklisted.', res);

        await database.addGuildBlacklistedUser({
            guildID,
            userID
        });

        const newBlacklistedUsers = await database.fetchGuildBlacklistedUsers(guildID);

        replyData(newBlacklistedUsers, req, res);

    });

    guildsRouter.delete('/:guildID/blacklisted/:userID', auth, permissions, premium, checkSchema({
        userID: {
            in: 'params',
            isString: true,
            matches: {
                options: DISCORD_ID_REGEX
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
        const userID = req.params.userID;

        const blacklistedUsers = await database.fetchGuildBlacklistedUsers(guildID);
        if (!blacklistedUsers.includes(userID)) return replyError(400, 'This user is not blacklisted.', res);

        await database.removeGuildBlacklistedUser({
            guildID,
            userID
        });

        const newBlacklistedUsers = await database.fetchGuildBlacklistedUsers(guildID);

        replyData(newBlacklistedUsers, req, res);

    });

};

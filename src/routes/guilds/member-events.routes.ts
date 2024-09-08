import { Router, Request, Response } from 'express';

/* Middlewares */
import auth from '../../middlewares/auth';
import permissions from '../../middlewares/permissions';
import premium from '../../middlewares/premium';

/* Helpers */
import database from '../../database';
import { replyData, replyError } from '../..';
import { DISCORD_ID_REGEX } from '../../utils/constants';
import { checkSchema, validationResult } from 'express-validator';

export default (guildsRouter: Router): void => {

    guildsRouter.get('/:guildID/members/:userID/events', auth, permissions, premium, checkSchema({
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

        const memberData = await database.fetchGuildMemberEvents({
            userID,
            guildID
        });

        replyData(memberData, req, res);

    });


};

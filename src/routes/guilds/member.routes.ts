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


    guildsRouter.get('/:guildID/members/:userID', auth, permissions, premium, checkSchema({
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

        const settings = await database.fetchGuildSettings(guildID);
        const memberData = await database.fetchGuildMember({
            userID,
            guildID,
            storageID: settings.storageID
        });

        replyData(memberData, req, res);

    });

    guildsRouter.post('/:guildID/members/:userID', auth, permissions, premium, checkSchema({
        userID: {
            in: 'params',
            isString: true,
            matches: {
                options: DISCORD_ID_REGEX
            }
        },
        number: {
            in: 'body',
            isInt: true
        },
        type: {
            in: 'body',
            isString: true,
            custom: {
                options: (value) => ['regular', 'bonus', 'fake', 'leaves'].includes(value)
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

        const number = req.body.number;
        const type = req.body.type;

        const settings = await database.fetchGuildSettings(guildID);

        const memberData = await database.fetchGuildMember({
            userID,
            guildID,
            storageID: settings.storageID
        });
        if (memberData.notCreated) await database.createGuildMember({
            userID,
            guildID,
            storageID: settings.storageID
        });
        await database.addInvites({
            userID,
            guildID,
            storageID: settings.storageID,
            number,
            type
        });

        const newMemberData = await database.fetchGuildMember({
            userID,
            guildID,
            storageID: settings.storageID
        });

        replyData(newMemberData, req, res);

    });

};

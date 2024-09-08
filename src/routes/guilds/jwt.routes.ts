import { Router } from 'express';

/* Middlewares */
import auth from '../../middlewares/auth';
import permissions from '../../middlewares/permissions';
import premium from '../../middlewares/premium';
import { createRatelimiter } from '../../middlewares/ratelimiter';

/* Helpers */
import database from '../../database';
import { generateGuildJWT } from '../../utils/jwt';
import { replyData, replyError } from '../..';

export default (guildsRouter: Router): void => {

    guildsRouter.get('/:guildID/jwt',  auth, createRatelimiter(5), permissions, premium, async (req, res) => {

        const guildID = req.params.guildID as `${bigint}`;
        const token = await database.fetchGuildAPIToken(guildID);

        return replyData({
            token
        }, req, res);

    });

    guildsRouter.post('/:guildID/jwt', auth, createRatelimiter(3, undefined, 1), permissions, premium, async (req, res) => {

        if (req.jwtType === 'guild') return replyError(403, 'Only user JWTs are allowed for this route.', res);

        const guildID = req.params.guildID as `${bigint}`;

        const newToken = generateGuildJWT(guildID);
        await database.updateGuildAPIToken(guildID, newToken, req.decodedJWT.userID, new Date());
        const token = await database.fetchGuildAPIToken(guildID);

        return replyData({
            token
        }, req, res);

    });

};

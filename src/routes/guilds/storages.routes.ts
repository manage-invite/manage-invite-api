import { Router } from 'express';

/* Middlewares */
import auth from '../../middlewares/auth';
import permissions from '../../middlewares/permissions';
import premium from '../../middlewares/premium';

/* Helpers */
import database from '../../database';
import { replyData } from '../..';

export default (guildsRouter: Router): void => {

    guildsRouter.get('/:guildID/storages', auth, permissions, premium, async (req, res) => {

        const guildID = req.params.guildID as `${bigint}`;
        const guildStorages = await database.fetchGuildStorages(guildID);

        replyData(guildStorages, req, res);

    });

    guildsRouter.post('/:guildID/storages', auth, permissions, premium, async (req, res) => {

        const guildID = req.params.guildID as `${bigint}`;
        await database.removeGuildInvites(guildID);

        const settings = await database.fetchGuildSettings(guildID);
        const storages = await database.fetchGuildStorages(guildID);

        replyData({
            storages,
            settings
        }, req, res);

    });

};

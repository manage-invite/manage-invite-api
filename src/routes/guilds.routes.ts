import { Router } from 'express';

/* Middlewares */
import auth from '../middlewares/auth';
import permissions from '../middlewares/permissions';
import { createRatelimiter } from '../middlewares/ratelimiter';
import premium from '../middlewares/premium';

/* Large routes */
import registerLeaderboardRoute from './guilds/leaderboard.routes';
import registerJwtRoute from './guilds/jwt.routes';
import registerBlacklistRoute from './guilds/blacklist.routes';
import registerMemberEventsRoute from './guilds/member-events.routes';
import registerMemberRoute from './guilds/member.routes';
import registerPluginsRoute from './guilds/plugins.routes';
import registerSettingsRoute from './guilds/settings.routes';
import registerStoragesRoute from './guilds/storages.routes';
import registerAlertsRoute from './guilds/alerts.routes';

/* Helpers */
import database from '../database';
import { replyData } from '../';
import { getChannelsOf } from '../ipc-server';
import { SubscriptionPayment } from '@androz2091/manage-invite-db-client/results';

const guildsRouter = Router();

registerLeaderboardRoute(guildsRouter);
registerJwtRoute(guildsRouter);
registerBlacklistRoute(guildsRouter);
registerMemberEventsRoute(guildsRouter);
registerMemberRoute(guildsRouter);
registerPluginsRoute(guildsRouter);
registerSettingsRoute(guildsRouter);
registerStoragesRoute(guildsRouter);
registerAlertsRoute(guildsRouter);

guildsRouter.get('/:guildID/channels', auth, createRatelimiter(3, undefined, 5), permissions, premium, async (req, res) => {

    const guildID = req.params.guildID;
    const channels = await getChannelsOf(guildID);

    replyData(channels, req, res);

});

guildsRouter.get('/:guildID/subscriptions', auth, permissions, premium, async (req, res) => {

    const guildID = req.params.guildID;
    const guildSubscriptions = await database.fetchGuildSubscriptions(guildID as `${bigint}`);
    const guildPayments: { subID: string, data: SubscriptionPayment }[] = [];
    for (const subscription of guildSubscriptions) {
        const payments = await database.fetchSubscriptionPayments(subscription.id);
        payments.forEach((payment) => {
            guildPayments.push({
                subID: subscription.id,
                data: payment
            });
        });
    }

    replyData({
        subscriptions: guildSubscriptions,
        payments: guildPayments
    }, req, res);

});

export default guildsRouter;

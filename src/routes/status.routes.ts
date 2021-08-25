import { Router } from 'express';
import { replyData } from '..';
import { getShardsStatus } from '../ipc-server';
import database from '../database';
import fetch from 'node-fetch';

const statusRouter = Router();

statusRouter.get('/shards', async (req, res) => {

    let uptime = await database.redis.getString('uptime');

    if (!uptime) {
        let watchbotStatus;
        try {
            watchbotStatus = await (await fetch(`https://api.watchbot.app/bot/${process.env.CLIENT_ID}`, {
                headers: {
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    'AUTH-TOKEN': process.env.WATCHBOT_API_KEY!
                }
            })).json();
        } catch (e) {
            watchbotStatus = {
                '7d': 'N/A'
            };
        }
        uptime = watchbotStatus['7d'];
        database.redis.setString('uptime', uptime);
        database.redis.client.expire('uptime', 100);
    }

    const shardsStatuses = await getShardsStatus();

    replyData({
        uptime,
        shards: shardsStatuses
    }, req, res);
});

export default statusRouter;

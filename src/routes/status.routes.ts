import { Router } from 'express';
import { replyData } from '..';
import { getShardsStatus } from '../ipc-server';

const statusRouter = Router();

statusRouter.get('/shards', async (req, res) => {

    const shardsStatuses = await getShardsStatus();

    replyData(shardsStatuses, req, res);
});

export default statusRouter;

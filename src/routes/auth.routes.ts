import { Router } from 'express';
import database from '../database';
import { replyData } from '..';

const authRouter = Router();

authRouter.get('/', async (req, res) => {

    replyData({}, req, res);

});

export default authRouter;

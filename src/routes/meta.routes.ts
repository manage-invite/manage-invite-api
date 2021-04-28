import { Router } from 'express';
import { replyData } from '..';
import availableLanguages from '../languages.json';

const metaRouter = Router();

metaRouter.get('/languages', async (req, res) => {
    replyData(availableLanguages, req, res);
});

export default metaRouter;

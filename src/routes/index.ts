import { Router } from 'express';
import guildsRouter from './guilds.routes';

const routes = Router();

routes.use('/guilds', guildsRouter);

export default routes;

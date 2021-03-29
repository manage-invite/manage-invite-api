import { Router } from 'express';
import guildsRouter from './guild.routes';

const routes = Router();

routes.use('/guilds', guildsRouter);

export default routes;

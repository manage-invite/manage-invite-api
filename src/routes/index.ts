import { Router } from 'express';
import guildsRouter from './guilds.routes';
import authRouter from './auth.routes';

const routes = Router();

routes.use('/users', guildsRouter);
routes.use('/auth', authRouter);

export default routes;

import { Router } from 'express';
import guildsRouter from './guilds.routes';
import authRouter from './auth.routes';
import inviteRouter from './invite.routes';

const routes = Router();

routes.use('/users', guildsRouter);
routes.use('/auth', authRouter);
routes.use('/invite', inviteRouter);

export default routes;

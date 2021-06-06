import { Router } from 'express';
import guildsRouter from './guilds.routes';
import authRouter from './auth.routes';
import inviteRouter from './invite.routes';
import userRouter from './user.routes';
import metaRouter from './meta.routes';
import statusRouter from './status.routes';
import paypalRouter from './paypal.routes';

const routes = Router();

routes.use('/users', guildsRouter);
routes.use('/auth', authRouter);
routes.use('/invite', inviteRouter);
routes.use('/user', userRouter);
routes.use('/guilds', guildsRouter);
routes.use('/meta', metaRouter);
routes.use('/status', statusRouter);
routes.use('/paypal', paypalRouter);

export default routes;

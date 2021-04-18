import { Router } from 'express';
import guildsRouter from './guilds.routes';
import authRouter from './auth.routes';
import inviteRouter from './invite.routes';
import userRouter from './user.routes';

const routes = Router();

routes.use('/users', guildsRouter);
routes.use('/auth', authRouter);
routes.use('/invite', inviteRouter);
routes.use('/user', userRouter);

export default routes;

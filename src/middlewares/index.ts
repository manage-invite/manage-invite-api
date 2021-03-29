import { Express } from 'express';
import PingMiddleware from './ping';
import AuthMiddleware from './auth';

export default (app: Express) => {
    PingMiddleware(app);
    AuthMiddleware(app);
};

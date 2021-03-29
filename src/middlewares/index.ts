import { Express } from 'express';
import PingMiddleware from './ping';

export default (app: Express) => {
    PingMiddleware(app);
};

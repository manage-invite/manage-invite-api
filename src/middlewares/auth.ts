import { Express } from "express";
import { replyError } from "..";

export default (app: Express) => {

    app.use((req, res, next) => {

        if (req.path.startsWith('/auth')) return next();

        const apiKey = req.headers['authorization'];
        if (!apiKey) {
            return replyError(403, 'Missing Authorization header', req, res);
        }

    });

};

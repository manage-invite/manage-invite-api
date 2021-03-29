import { Express } from "express";

export default (app: Express) => {
    app.use((req, res, next) => {
        req.startTime = Date.now();
        next();
    });
};

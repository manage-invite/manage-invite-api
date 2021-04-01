import { Server } from "socket.io";

declare namespace Express {
    export interface Request {
       startTime: number;
       socketIO: Server;
    }
}


declare namespace Express {

    import { Server } from "socket.io";

    export interface Request {
       startTime: number;
       socketio: Server;
    }
}

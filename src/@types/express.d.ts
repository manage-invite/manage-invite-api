declare namespace Express {

    import { Server } from "socket.io";
    import { DecodedGuildJWT, DecodedUserJWT, JWTType } from "../utils/jwt";

    export interface Request {
       startTime: number;
       socketio: Server;
       jwt: string;
       jwtType: JWTType;
       decodedJWT: DecodedGuildJWT|DecodedUserJWT;
    }
}

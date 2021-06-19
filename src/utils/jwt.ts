import jsonwebtoken from 'jsonwebtoken';

export type JWTType = 'user' | 'guild';

export interface DecodedUserJWT {
    type: JWTType;
    userID: string;
}

export interface DecodedGuildJWT {
    type: JWTType;
    guildID: string;
}

export const decodeJWT = (jwt: string): DecodedGuildJWT|DecodedUserJWT|null => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const decoded = jsonwebtoken.verify(jwt, process.env.JWT_PRIVATE_KEY!);
        return decoded as DecodedUserJWT|DecodedGuildJWT;
    } catch {
        return null;
    }
};

export const generateDashJWT = (userID: string, accessToken: string, expiresIn: number): string => {
    return jsonwebtoken.sign({
        type: 'user',
        userID,
        accessToken,
        accessTokenExpiresAt: Date.now() + expiresIn * 1000
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    }, process.env.JWT_PRIVATE_KEY!);
};

export const generateGuildJWT = (guildID: string): string => {
    return jsonwebtoken.sign({
        type: 'guild',
        guildID
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    }, process.env.JWT_PRIVATE_KEY!);
};

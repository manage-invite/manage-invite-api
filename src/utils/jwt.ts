import jsonwebtoken from 'jsonwebtoken';

export type JWTType = 'user' | 'guild';

export interface DecodedUserJWT {
    userID: string;
}

export interface DecodedGuildJWT {
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
        userID,
        accessToken,
        expiresAt: Date.now() + expiresIn * 1000
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    }, process.env.JWT_PRIVATE_KEY!);
};

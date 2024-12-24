import jwt from 'jsonwebtoken';

/**
* JWT Manager class for generating and verifying JWT tokens
* @class JWTManager
*/
export class JWTManager {
    /**
    * @private secret - The secret key for the JWT
    * @private algorithm - The algorithm to use for the JWT
    * @private expirationTime - The expiration time of the JWT
    */
    private secret: string;
    private algorithm: 'HS256' | 'HS384' | 'HS512';
    private expirationTime: string;

    constructor(
        secret: string,
        algorithm: 'HS256' | 'HS384' | 'HS512',
        expirationTime: string
    ) {
        this.secret = secret;
        this.algorithm = algorithm;
        this.expirationTime = expirationTime;
    }

    /**
    * Generate a JWT token
    * @param payload - The payload to include in the token
    * @returns {string} The generated JWT token
    */
    public generateToken(payload: { userId: string }): string {
        return jwt.sign(payload, this.secret, {
            algorithm: this.algorithm,
            expiresIn: this.expirationTime
        });
    }
    
    /**
    * Verify a JWT token
    * @param token - The token to verify
    * @returns {any} The payload of the token
    */
    public verifyToken(token: string): any {
        try {
            return jwt.verify(token, this.secret, {
                algorithms: [this.algorithm]
            });
        } catch (error) {
            return null;
        }
    }

    /**
    * Get the expiration date of the JWT token
    * @returns {Date} The expiration date of the JWT token
    */
    public getTokenExpiration(): Date {
        // Convert duration string (e.g., '24h') to milliseconds
        const ms = this.parseDuration(this.expirationTime);
        return new Date(Date.now() + ms);
    }

    /**
    * Parse the duration string to milliseconds
    * @param duration - The duration string (e.g., '24h')
    * @returns {number} The duration in milliseconds
    */
    private parseDuration(duration: string): number {
        const unit = duration.slice(-1);
        const value = parseInt(duration.slice(0, -1));
        
        switch (unit) {
            case 'h':
                return value * 60 * 60 * 1000;
            case 'm':
                return value * 60 * 1000;
            case 's':
                return value * 1000;
            case 'd':
                return value * 24 * 60 * 60 * 1000;
            default:
                throw new Error(`Unsupported duration unit: ${unit}`);
        }
    }
}

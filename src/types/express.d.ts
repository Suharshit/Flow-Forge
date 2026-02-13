import { JWTPayload } from './user.types';

declare global {
    namespace Express {
        interface Request {
            user?: JWTPayload;
        }
    }
}

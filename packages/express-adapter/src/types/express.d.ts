import { TokenPayload } from '@auth-template/core/application';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

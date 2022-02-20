import { Request } from 'express';
import { UserAccessTokenClaims } from 'src/auth/dtos/auth-token-output.dto';

export interface UserAuthRequest extends Request {
  user: UserAccessTokenClaims;
}

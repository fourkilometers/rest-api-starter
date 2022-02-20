import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { UserAuthRequest } from 'src/type/UserAuthRequestInterface';
import { AppLogger } from '../../shared/logger/logger.service';
import { createRequestContext } from '../../shared/request-context/util';
import { AuthService } from '../auth.service';
import { STRATEGY_LOCAL } from '../constants/strategy.constant';
import { UserAccessTokenClaims } from '../dtos/auth-token-output.dto';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, STRATEGY_LOCAL) {
  constructor(
    private authService: AuthService,
    private readonly logger: AppLogger,
  ) {
    // Add option passReqToCallback: true to configure strategy to be request-scoped.
    super({
      usernameField: 'username',
      passwordField: 'password',
      passReqToCallback: true,
    });
    this.logger.setContext(LocalStrategy.name);
  }

  async validate(
    request: UserAuthRequest,
    username: string,
    password: string,
  ): Promise<UserAccessTokenClaims> {
    const ctx = createRequestContext(request);

    this.logger.log(ctx, `${this.validate.name} was called`);

    const user = await this.authService.validateUser(ctx, username, password);
    // Passport automatically creates a user object, based on the value we return from the validate() method,
    // and assigns it to the Request object as req.user
    return user;
  }
}

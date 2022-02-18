import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { plainToClass } from 'class-transformer';
import { AppLogger } from 'src/shared/logger/logger.service';
import { RequestContext } from 'src/shared/request-context/request-context.dto';
import { createRequestContext } from 'src/shared/request-context/util';
import { UserOutput } from 'src/user/dtos/user-output.dto';
import { UserService } from 'src/user/user.service';
import { ROLE } from './constants/role.constant';
import { RegisterInput } from './dtos/auth-register-input.dto';
import { RegisterOutput } from './dtos/auth-register-output.dto';
import {
  AuthTokenOutput,
  UserAccessTokenClaims,
} from './dtos/auth-token-output.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(AuthService.name);
  }

  login(ctx: RequestContext): AuthTokenOutput {
    this.logger.log(ctx, `${this.login.name} was called`);
    return this.getAuthToken(ctx, ctx.user);
  }

  async register(ctx: RequestContext, input: RegisterInput) {
    this.logger.log(ctx, `${this.register.name} was called`);

    input.roles = [ROLE.USER];
    input.isAccountDisabled = false;
    const registerUser = await this.userService.createUser(ctx, input);
    return plainToClass(RegisterOutput, registerUser, {
      excludeExtraneousValues: true,
    });
  }

  getAuthToken(
    ctx: RequestContext,
    user: UserAccessTokenClaims | UserOutput,
  ): AuthTokenOutput {
    this.logger.log(ctx, `${this.getAuthToken.name} was called`);

    const subject = { sub: user.id };
    const payload = {
      username: user.username,
      sub: user.id,
      roles: user.roles,
    };
    const authToken = {
      refreshToken: this.jwtService.sign(subject, {
        expiresIn: this.configService.get('jwt.refreshTokenExpiresInsec'),
      }),
      accessToken: this.jwtService.sign(
        { ...payload, ...subject },
        { expiresIn: this.configService.get('jwt.accessTokenExpiresInSec') },
      ),
    };
    return plainToClass(AuthTokenOutput, authToken, {
      excludeExtraneousValues: true,
    });
  }

  async validate(
    request: Request,
    username: string,
    password: string,
  ): Promise<UserAccessTokenClaims> {
    const ctx = createRequestContext(request);

    this.logger.log(ctx, `${this.validate.name} was called`);

    const user = await this.validateUser(ctx, username, password);
    // Passport automatically creates a user object, based on the value we return from the validate() method,
    // and assigns it to the Request object as req.user
    return user;
  }

  async validateUser(
    ctx: RequestContext,
    username: string,
    pass: string,
  ): Promise<UserAccessTokenClaims> {
    this.logger.log(ctx, `${this.validateUser.name} was called`);

    // The userService will throw Unauthorized in case of invalid username/password.
    const user = await this.userService.validateUsernamePassword(
      ctx,
      username,
      pass,
    );

    // Prevent disabled users from logging in.
    if (user.isAccountDisabled) {
      throw new UnauthorizedException('This user account has been disabled');
    }

    return user;
  }
}

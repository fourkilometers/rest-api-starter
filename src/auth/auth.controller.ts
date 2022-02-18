import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  BaseApiErrorResponse,
  BaseApiResponse,
  SwaggerBaseApiResponse,
} from 'src/shared/dtos/base-api-response.dto';
import { AppLogger } from 'src/shared/logger/logger.service';
import { ReqContext } from 'src/shared/request-context/req-context.decorator';
import { RequestContext } from 'src/shared/request-context/request-context.dto';
import { AuthService } from './auth.service';
import { LoginInput } from './dtos/auth-login-input.dto';
import { RegisterInput } from './dtos/auth-register-input.dto';
import { RegisterOutput } from './dtos/auth-register-output.dto';
import { AuthTokenOutput } from './dtos/auth-token-output.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(AuthController.name);
  }

  @Post('login')
  @ApiOperation({ summary: 'User login API' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(AuthTokenOutput),
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: BaseApiErrorResponse })
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  login(
    @ReqContext() ctx: RequestContext,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Body() credential: LoginInput,
  ): BaseApiResponse<AuthTokenOutput> {
    this.logger.log(ctx, `${this.login.name} was called`);

    const authToken = this.authService.login(ctx);
    return { data: authToken, meta: {} };
  }

  @Post('register')
  @ApiOperation({ summary: 'User registration API' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: SwaggerBaseApiResponse(RegisterOutput),
  })
  async registerLocal(
    @ReqContext() ctx: RequestContext,
    @Body() input: RegisterInput,
  ): Promise<BaseApiResponse<RegisterOutput>> {
    const registeredUser = await this.authService.register(ctx, input);
    return { data: registeredUser, meta: {} };
  }
}

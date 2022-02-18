import { Injectable, UnauthorizedException } from '@nestjs/common';
import { compare, hash } from 'bcrypt';
import { plainToClass } from 'class-transformer';
import { AppLogger } from 'src/shared/logger/logger.service';
import { RequestContext } from 'src/shared/request-context/request-context.dto';
import { CreateUserInput } from './dtos/user-create-input.dto';
import { UserOutput } from './dtos/user-output.dto';
import { User } from './entities/user.entity';
import { UserRepository } from './repositories/user.repository';

@Injectable()
export class UserService {
  constructor(
    private repository: UserRepository,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(UserService.name);
  }

  async createUser(
    ctx: RequestContext,
    input: CreateUserInput,
  ): Promise<UserOutput> {
    this.logger.log(ctx, `${this.createUser.name} was called`);

    const user = plainToClass(User, input);
    user.password = await hash(input.password, 10);

    const updatedUser: User = {
      ...user,
      ...plainToClass(User, user),
    };

    this.logger.log(ctx, `calling ${UserRepository.name}.save`);
    await this.repository.save(updatedUser);

    return plainToClass(UserOutput, updatedUser, {
      excludeExtraneousValues: true,
    });
  }

  async getUserById(ctx: RequestContext, id: number): Promise<UserOutput> {
    this.logger.log(ctx, `${this.getUserById.name} was called`);

    this.logger.log(ctx, `calling ${UserRepository.name}.getById`);
    const user = await this.repository.getById(id);

    return plainToClass(UserOutput, user, {
      excludeExtraneousValues: true,
    });
  }

  async validateUsernamePassword(
    ctx: RequestContext,
    username: string,
    pass: string,
  ): Promise<UserOutput> {
    this.logger.log(ctx, `${this.validateUsernamePassword.name} was called`);

    this.logger.log(ctx, `calling ${UserRepository.name}.findOne`);
    const user = await this.repository.findOne({ username });
    if (!user) throw new UnauthorizedException();

    const match = await compare(pass, user.password);
    if (!match) throw new UnauthorizedException();

    return plainToClass(UserOutput, user, {
      excludeExtraneousValues: true,
    });
  }
}

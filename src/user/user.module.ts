import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedModule } from 'src/shared/shared.module';
import { UserRepository } from './repositories/user.repository';
import { UserAclService } from './user-acl.service';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [SharedModule, TypeOrmModule.forFeature([UserRepository])],
  providers: [UserService, UserAclService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}

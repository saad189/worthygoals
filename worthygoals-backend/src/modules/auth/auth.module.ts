import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AWSCognitoService } from './aws-cognito.service';
import { UsersModule } from '../users/users.module';
import { CognitoJwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [UsersModule],
  providers: [AuthService, CognitoJwtStrategy, AWSCognitoService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}

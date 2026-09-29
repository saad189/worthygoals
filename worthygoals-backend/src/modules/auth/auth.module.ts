import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AWSCognitoService } from './aws-cognito.service';
import { CognitoJwtStrategy } from './strategies/jwt.strategy';

@Module({
  providers: [AuthService, CognitoJwtStrategy, AWSCognitoService],
  controllers: [AuthController],
  // AWSCognitoService is exported rather than re-provided elsewhere: UsersModule
  // listed it in its own providers, so two instances existed. Anything the
  // service holds per-process — the per-account throttle counters below, for
  // one — would silently diverge between them.
  exports: [AuthService, AWSCognitoService],
})
export class AuthModule {}

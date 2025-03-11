import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JWT } from '../constants';

@Injectable()
export class JwtAuthGuard implements CanActivate {

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();

        const authGuard = new (AuthGuard(JWT))();
        const result = await authGuard.canActivate(context);

        if (!result) {
            throw new UnauthorizedException('Unauthorized, Invalid token!');
        }

        const user = request.user;

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        return true;
    }
}

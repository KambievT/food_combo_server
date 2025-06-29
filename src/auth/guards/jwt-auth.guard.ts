import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const authHeader = req.headers['authorization'];
    const accessToken =
      authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : null;
    const refreshToken = req.cookies?.refresh_token;

    if (!accessToken) {
      console.log('Нет access token');
    } else {
      console.log('Access token присутствует');
    }

    if (!refreshToken) {
      console.log('Нет refresh token');
    } else {
      console.log('Refresh token присутствует');
    }

    return super.canActivate(context);
  }

  handleRequest(err, user, info, context) {
    if (err || !user) {
      console.log('JwtAuthGuard: Ошибка или пользователь не найден', err, info);
      throw err || new UnauthorizedException('Не авторизован');
    }
    return user;
  }
}

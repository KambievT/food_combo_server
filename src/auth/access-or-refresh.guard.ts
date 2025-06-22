import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { Request, Response } from 'express';

@Injectable()
export class AccessOrRefreshGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    const authHeader = req.headers['authorization'];
    let accessToken: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      accessToken = authHeader.slice(7);
    }

    // 1. Проверяем access token
    if (accessToken) {
      try {
        const payload = this.jwtService.verify(accessToken);
        // Проверяем пользователя в базе
        const user = await this.prisma.user.findUnique({
          where: { id: payload.sub },
        });
        if (!user) {
          throw new UnauthorizedException('User not found');
        }
        req.user = payload;
        return true;
      } catch (e) {
        // access token невалиден, пробуем refresh
      }
    }

    // 2. Пробуем refresh token
    const refreshToken = req.cookies?.refresh_token;
    if (refreshToken) {
      // Находим пользователя по refreshToken
      const user = await this.prisma.user.findFirst({
        where: { refreshToken },
      });
      if (user) {
        // Генерируем новый access token
        const payload = { email: user.email, sub: user.id };
        const newAccessToken = this.jwtService.sign(payload);
        // Можно вернуть новый access token в заголовке или json, но guard не может отправлять ответ
        // Поэтому просто подставляем user в req.user, клиенту нужно будет обновить access token
        req.user = user;
        res.setHeader('x-new-access-token', newAccessToken);
        return true;
      }
    }
    // 3. Нет refresh token — редиректим на /auth/login
    throw new UnauthorizedException('Not authenticated');
  }
}

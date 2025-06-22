import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
  Req,
  Res,
  ConflictException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { AuthGuard } from '@nestjs/passport';
import { Response, Request } from 'express';
import { AccessOrRefreshGuard } from './access-or-refresh.guard';

class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  name: string;
}

class RegisterDto extends LoginDto {}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Res() response: Response) {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const result = await this.authService.login(user, response);
    return response.json(result);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto, @Res() response: Response) {
    const result = await this.authService.register(
      registerDto.email,
      registerDto.password,
      registerDto.name,
      response,
    );
    return response.json(result);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token');
    }
    // Находим пользователя по refreshToken
    const user = await this.authService['prisma'].user.findFirst({
      where: { refreshToken },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    return this.authService.refreshToken(user.id, refreshToken, res);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies?.refresh_token;
    if (refreshToken) {
      // Находим пользователя по refreshToken
      const user = await this.authService['prisma'].user.findFirst({
        where: { refreshToken },
      });
      if (user) {
        // Очищаем refreshToken в базе
        await this.authService['prisma'].user.update({
          where: { id: user.id },
          data: { refreshToken: null },
        });
      }
    }
    // Очищаем cookie
    res.clearCookie('refresh_token', { path: '/' });
    return res.json({ message: 'Logged out' });
  }

  @Get('profile')
  @UseGuards(AccessOrRefreshGuard)
  async getProfile(@Req() req: Request, @Res() res: Response) {
    // req.user будет установлен guard-ом
    return res.json({ user: req.user });
  }
}

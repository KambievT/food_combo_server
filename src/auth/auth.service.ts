import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma.service';
import { Response } from 'express';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async validateUser(email: string, password: string) {
    const user = await this.findUserByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async generateRefreshToken(): Promise<string> {
    return randomBytes(64).toString('hex');
  }

  async login(
    user: { id: number; email: string; name: string },
    response?: Response,
  ) {
    const payload = { email: user.email, sub: user.id };
    const access_token = this.jwtService.sign(payload);
    const refresh_token = await this.generateRefreshToken();
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: refresh_token },
    });
    if (response) {
      response.cookie('refresh_token', refresh_token, {
        httpOnly: true,
        sameSite: 'none',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        secure: true,
      });
    }
    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  async register(
    email: string,
    password: string,
    name: string,
    response?: Response,
  ) {
    const existingUser = await this.findUserByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await this.prisma.user.create({
      data: { email, password: hashedPassword, name },
    });

    return this.login(
      {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
      },
      response,
    );
  }

  async refreshToken(userId: number, refreshToken: string, response: Response) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.refreshToken !== refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const payload = { email: user.email, sub: user.id };
    const access_token = this.jwtService.sign(payload);
    return response.json({ access_token });
  }
}

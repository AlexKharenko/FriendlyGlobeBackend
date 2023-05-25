import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from './prisma.service';

const ACCESS_TOKEN_ALIVE = '30m';
const REFRESH_TOKEN_ALIVE = '30d';

@Injectable()
export class TokenService {
  constructor(
    private jwtService: JwtService,
    private prismaService: PrismaService,
  ) {}
  generateTokens(payload) {
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_TOKEN_SECRET,
      expiresIn: ACCESS_TOKEN_ALIVE,
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_TOKEN_SECRET,
      expiresIn: REFRESH_TOKEN_ALIVE,
    });
    return { accessToken, refreshToken };
  }
  validateRefreshToken(refreshToken) {
    try {
      const userData = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_TOKEN_SECRET,
      });
      return userData;
    } catch (error) {
      return null;
    }
  }
  validateAccessToken(accessToken) {
    try {
      const userData = this.jwtService.verify(accessToken, {
        secret: process.env.JWT_ACCESS_TOKEN_SECRET,
      });
      return userData;
    } catch (error) {
      return null;
    }
  }

  async createRefreshTokenInDB(userId, refreshToken) {
    await this.prismaService.refreshToken.create({
      data: {
        refreshToken,
        userId: userId,
      },
    });
  }

  async deleteRefreshTokenFromDB(refreshToken: string) {
    await this.prismaService.refreshToken.delete({ where: { refreshToken } });
  }

  async deleteRefreshTokenFromDBByUserId(userId) {
    await this.prismaService.refreshToken.delete({ where: { userId } });
  }

  async getRefreshTokenByUserId(userId) {
    return await this.prismaService.refreshToken.findUnique({
      where: { userId },
    });
  }

  async getRefreshToken(refreshToken) {
    return await this.prismaService.refreshToken.findUnique({
      where: { refreshToken },
    });
  }

  async saveRefreshToken(userId, refreshToken) {
    await this.prismaService.refreshToken.upsert({
      where: {
        userId,
      },
      update: {
        refreshToken,
      },
      create: {
        userId,
        refreshToken,
      },
    });
  }
}

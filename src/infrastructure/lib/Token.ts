import { IPayload, IToken } from '../../common/interface';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { env } from '../../config';
import { UnauthorizedException } from '@nestjs/common';
import type { CookieOptions, Response } from 'express';

const ACCESS_MAX_AGE = 24 * 60 * 60 * 1000; // 1 kun
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 kun

export class Token {
  private static readonly jwt = new JwtService();

  private static cookieOptions(maxAge: number): CookieOptions {
    const isProd = process.env.NODE_ENV === 'production';
    return {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/',
      maxAge,
    };
  }

  static async getToken(payload: IPayload): Promise<IToken> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: env.TOKEN.ACCESS_KEY,
        expiresIn: env.TOKEN.ACCESS_TIME as JwtSignOptions['expiresIn'],
      }),
      this.jwt.signAsync(payload, {
        secret: env.TOKEN.REFRESH_KEY,
        expiresIn: env.TOKEN.REFRESH_TIME as JwtSignOptions['expiresIn'],
      }),
    ]);
    return { accessToken, refreshToken };
  }

  static async verifyToken(
    token: string,
    type: 'access' | 'refresh',
  ): Promise<any> {
    try {
      return await this.jwt.verifyAsync(token, {
        secret: type === 'access' ? env.TOKEN.ACCESS_KEY : env.TOKEN.REFRESH_KEY,
      });
    } catch (error) {
      throw new UnauthorizedException('Tizimga kirishda nosozlik');
    }
  }

  static setCookie(
    res: Response,
    accessToken: string,
    refreshToken?: string,
  ): void {
    res.cookie('accessToken', accessToken, this.cookieOptions(ACCESS_MAX_AGE));
    if (refreshToken) {
      res.cookie(
        'refreshToken',
        refreshToken,
        this.cookieOptions(REFRESH_MAX_AGE),
      );
    }
  }

  static clearCookie(res: Response): void {
    const { maxAge, ...options } = this.cookieOptions(0);
    res.clearCookie('accessToken', options);
    res.clearCookie('refreshToken', options);
  }
}

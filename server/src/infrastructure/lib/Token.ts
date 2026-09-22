import { IPayload, IToken } from '../../common/interface';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { env } from '../../config';
import { UnauthorizedException } from '@nestjs/common';
import type { CookieOptions, Response } from 'express';
import ms, { type StringValue } from 'ms';
import { randomUUID } from 'crypto';

export class Token {
  private static readonly jwt = new JwtService();

  /** "15m" / "7d" ko'rinishidagi TTL'ni millisekundga o'giradi */
  static ttlToMs(ttl: string, fallbackMs: number): number {
    try {
      const value = ms(ttl as StringValue);
      return typeof value === 'number' && value > 0 ? value : fallbackMs;
    } catch (e) {
      return fallbackMs;
    }
  }

  static get accessMaxAge(): number {
    return this.ttlToMs(env.TOKEN.ACCESS_TTL, 15 * 60 * 1000);
  }

  static get refreshMaxAge(): number {
    return this.ttlToMs(env.TOKEN.REFRESH_TTL, 7 * 24 * 60 * 60 * 1000);
  }

  private static cookieOptions(maxAge: number): CookieOptions {
    return {
      httpOnly: true,
      secure: !env.IS_DEV,
      sameSite: 'lax',
      path: '/',
      maxAge,
    };
  }

  static async getToken(payload: IPayload): Promise<IToken> {
    /*
     * Har bir token noyob `jti` oladi: aks holda bir soniya ichida
     * qayta imzolangan tokenlar bayt-ma-bayt bir xil bo'lib qoladi
     * va rotatsiya/qayta ishlatishni aniqlab bo'lmaydi.
     */
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(
        { ...payload, jti: randomUUID(), typ: 'access' },
        {
          secret: env.TOKEN.ACCESS_KEY,
          expiresIn: env.TOKEN.ACCESS_TTL as JwtSignOptions['expiresIn'],
        },
      ),
      this.jwt.signAsync(
        { ...payload, jti: randomUUID(), typ: 'refresh' },
        {
          secret: env.TOKEN.REFRESH_KEY,
          expiresIn: env.TOKEN.REFRESH_TTL as JwtSignOptions['expiresIn'],
        },
      ),
    ]);
    return { accessToken, refreshToken };
  }

  static async verifyToken(
    token: string,
    type: 'access' | 'refresh',
  ): Promise<any> {
    try {
      return await this.jwt.verifyAsync(token, {
        secret:
          type === 'access' ? env.TOKEN.ACCESS_KEY : env.TOKEN.REFRESH_KEY,
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
    res.cookie(
      'accessToken',
      accessToken,
      this.cookieOptions(this.accessMaxAge),
    );
    if (refreshToken) {
      res.cookie(
        'refreshToken',
        refreshToken,
        this.cookieOptions(this.refreshMaxAge),
      );
    }
  }

  static clearCookie(res: Response): void {
    const { maxAge, ...options } = this.cookieOptions(0);
    res.clearCookie('accessToken', options);
    res.clearCookie('refreshToken', options);
  }
}

import { ExecutionContext, Injectable } from '@nestjs/common';
import {
  ThrottlerGuard,
  ThrottlerLimitDetail,
  ThrottlerRequest,
} from '@nestjs/throttler';
import { STRICT_RATE_LIMIT_KEY } from '../decorators/throttle.decorator';
import { Token } from '../../infrastructure/lib/Token';

export const STRICT_THROTTLER = 'strict';
export const DEFAULT_THROTTLER = 'default';

/**
 * Throttler AuthGuard'dan OLDIN ishlaydi (anonim so'rovlar ham hisoblanishi uchun),
 * shuning uchun foydalanuvchi cookie'dagi access tokendan aniqlanadi.
 * Natija so'rov obyektida keshlanadi.
 */
export async function resolveThrottleUserId(
  req: Record<string, any>,
): Promise<string | null> {
  if (req.user?.sub) return req.user.sub;
  if (req.__throttleUserId !== undefined) return req.__throttleUserId;

  let userId: string | null = null;
  const token = req.cookies?.accessToken;
  if (token) {
    try {
      const payload = await Token.verifyToken(token, 'access');
      userId = payload?.sub ?? null;
    } catch (e) {
      userId = null;
    }
  }
  req.__throttleUserId = userId;
  return userId;
}

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  /** Proxy ortida ham to'g'ri IP (app'da `trust proxy` yoqilgan) */
  private clientIp(req: Record<string, any>): string {
    return req.ips?.length ? req.ips[0] : (req.ip ?? 'unknown');
  }

  /**
   * Autentifikatsiyalangan so'rovlar userId bo'yicha,
   * anonim so'rovlar IP bo'yicha hisoblanadi.
   */
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const userId = await resolveThrottleUserId(req);
    return userId ? `user:${userId}` : `ip:${this.clientIp(req)}`;
  }

  /*
   * Qattiq limit kaliti: IP + telefon raqami, har bir endpoint uchun alohida.
   * Endpointlar bitta chelakni bo'lishsa, bitta sign-in oqimi
   * (signin + 3 ta OTP urinishi) limitga urilib qolar edi.
   */
  protected generateKey(
    context: ExecutionContext,
    tracker: string,
    name: string,
  ): string {
    if (name === STRICT_THROTTLER) {
      const req = context.switchToHttp().getRequest();
      const phone = String(req.body?.phone ?? 'unknown').replace(/\D/g, '');
      const route = `${context.getClass().name}.${context.getHandler().name}`;
      return `throttle:${STRICT_THROTTLER}:${route}:${this.clientIp(
        req,
      )}:${phone}`;
    }
    return super.generateKey(context, tracker, name);
  }

  /** `strict` throttler faqat @StrictRateLimit() bilan belgilangan yo'nalishlarda */
  protected async handleRequest(props: ThrottlerRequest): Promise<boolean> {
    const isStrictRoute = this.reflector.getAllAndOverride<boolean>(
      STRICT_RATE_LIMIT_KEY,
      [props.context.getHandler(), props.context.getClass()],
    );
    if (props.throttler.name === STRICT_THROTTLER && !isStrictRoute) {
      return true;
    }
    return super.handleRequest(props);
  }

  /** 429 javobida standart `Retry-After` header bo'lishi kafolatlanadi */
  protected async throwThrottlingException(
    context: ExecutionContext,
    detail: ThrottlerLimitDetail,
  ): Promise<void> {
    const { res } = this.getRequestResponse(context);
    const retryAfter = Math.ceil(
      (detail.timeToBlockExpire || detail.timeToExpire) ?? 60,
    );
    res.header?.('Retry-After', String(retryAfter));
    return super.throwThrottlingException(context, detail);
  }
}

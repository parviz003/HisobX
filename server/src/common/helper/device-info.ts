import DeviceDetector from 'device-detector-js';
import type { Request } from 'express';

export interface DeviceInfo {
  /** Inson o'qiydigan nom: "Chrome Android" */
  device: string;
  browser: string | null;
  os: string | null;
  /** smartphone | desktop | tablet | ... */
  deviceType: string | null;
  ip: string | null;
}

const detector = new DeviceDetector();

/** Qurilmani `user-agent` va so'rov IP'si bo'yicha aniqlaydi */
export function getDeviceInfo(req: Request): DeviceInfo {
  const userAgent = req.headers['user-agent'] || '';
  const parsed = detector.parse(userAgent);

  const browser = parsed.client?.name || null;
  const os = parsed.os?.name || null;
  const deviceType = parsed.device?.type || null;

  return {
    device: `${browser ?? 'Browser'} ${os ?? 'Device'}`,
    browser,
    os,
    deviceType,
    ip: resolveIp(req),
  };
}

/** Proxy ortida haqiqiy IP (`trust proxy` sozlangan bo'lsa `req.ip` yetarli) */
function resolveIp(req: Request): string | null {
  const ip = req.ip ?? req.socket?.remoteAddress ?? null;
  if (!ip) return null;
  // IPv4-mapped IPv6 ("::ffff:127.0.0.1") ni soddalashtiramiz
  return ip.startsWith('::ffff:') ? ip.slice(7) : ip;
}

import DeviceDetector from 'device-detector-js';
import type { Request } from 'express';

export function getDeviceInfo(req: Request) {
  const deviceDetector = new DeviceDetector();
  const userAgent = req.headers['user-agent'] || '';
  return deviceDetector.parse(userAgent);
}

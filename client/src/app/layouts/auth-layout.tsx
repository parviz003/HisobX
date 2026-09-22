import { Outlet } from 'react-router';
import { BrandLogo } from '@/components/common/brand-logo';
import { OfflineBanner } from '@/components/common/offline-banner';

/** Login, OTP, parolni tiklash sahifalari uchun sodda markazlashgan qobiq. */
export function AuthLayout() {
  return (
    <div className="bg-background flex min-h-dvh flex-col">
      <OfflineBanner />
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex justify-center">
            <BrandLogo className="scale-125" />
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

import { useMediaQuery } from './use-media-query';

const MOBILE_BREAKPOINT = 768;

/**
 * shadcn `sidebar` komponenti shu hook'ni kutadi.
 * Ichki mantiq `useMediaQuery` ga yuklangan — bitta joyda turadi.
 */
export function useIsMobile(): boolean {
  return useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
}

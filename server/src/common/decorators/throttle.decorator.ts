import { SetMetadata } from '@nestjs/common';

export const STRICT_RATE_LIMIT_KEY = 'strictRateLimit';

export const StrictRateLimit = () => SetMetadata(STRICT_RATE_LIMIT_KEY, true);

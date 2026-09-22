export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
  devices: () => [...authKeys.all, 'devices'] as const,
  telegramLink: (token: string) => [...authKeys.all, 'telegram-link', token] as const,
};

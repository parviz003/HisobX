export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
  devices: () => [...authKeys.all, 'devices'] as const,
};

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { RoleGuard } from './role-guard';
import type { Role } from '@/lib/permissions';

const mockAuth = vi.hoisted(() => ({ role: null as Role | null, isLoading: false }));

vi.mock('@/features/auth/hooks/use-auth', () => ({
  useAuth: () => mockAuth,
}));

function renderAt(path: string, roles: readonly Role[]) {
  const router = createMemoryRouter(
    [
      {
        path: '/secret',
        element: <RoleGuard roles={roles} />,
        children: [{ index: true, element: <p>Maxfiy bo'lim</p> }],
      },
      { path: '/403', element: <p>Ruxsat yo'q</p> },
    ],
    { initialEntries: [path] },
  );
  return render(<RouterProvider router={router} />);
}

describe('RoleGuard', () => {
  beforeEach(() => {
    mockAuth.role = null;
    mockAuth.isLoading = false;
  });

  it('ruxsat etilgan rolni ichkariga kiritadi', async () => {
    mockAuth.role = 'MANAGER';
    renderAt('/secret', ['MANAGER', 'ADMIN']);
    expect(await screen.findByText("Maxfiy bo'lim")).toBeInTheDocument();
  });

  it("begona rolni 403 ga yuboradi", async () => {
    mockAuth.role = 'SELLER';
    renderAt('/secret', ['MANAGER', 'ADMIN']);
    expect(await screen.findByText("Ruxsat yo'q")).toBeInTheDocument();
    expect(screen.queryByText("Maxfiy bo'lim")).not.toBeInTheDocument();
  });

  it('SUPERADMIN ham ruxsat etilmagan bo\'limga kira olmaydi', async () => {
    mockAuth.role = 'SUPERADMIN';
    renderAt('/secret', ['MANAGER', 'ADMIN', 'SELLER']);
    expect(await screen.findByText("Ruxsat yo'q")).toBeInTheDocument();
  });

  it('rol aniqlanmagan bo\'lsa 403 ga yuboradi', async () => {
    mockAuth.role = null;
    renderAt('/secret', ['MANAGER']);
    expect(await screen.findByText("Ruxsat yo'q")).toBeInTheDocument();
  });

  it('yuklanayotganda hech narsa ko\'rsatmaydi', () => {
    mockAuth.isLoading = true;
    mockAuth.role = null;
    renderAt('/secret', ['MANAGER']);
    expect(screen.queryByText("Maxfiy bo'lim")).not.toBeInTheDocument();
    expect(screen.queryByText("Ruxsat yo'q")).not.toBeInTheDocument();
  });
});

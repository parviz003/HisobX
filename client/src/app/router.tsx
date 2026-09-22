import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router';
import { AppLayout } from './layouts/app-layout';
import { AuthLayout } from './layouts/auth-layout';
import { RequireAuth } from './guards/require-auth';
import { RoleGuard } from './guards/role-guard';
import { FullPageSpinner } from './pages/full-page-spinner';
import { HomeRedirect } from './home-redirect';

const LoginPage = lazy(() => import('@/features/auth/pages/login-page'));
const DashboardPage = lazy(() => import('@/features/dashboard/pages/dashboard-page'));
const PosPage = lazy(() => import('@/features/pos/pages/pos-page'));
const SalesPage = lazy(() => import('@/features/sales/pages/sales-page'));
const ProductsPage = lazy(() => import('@/features/products/pages/products-page'));
const CategoriesPage = lazy(() => import('@/features/categories/pages/categories-page'));
const InventoryPage = lazy(() => import('@/features/inventory/pages/inventory-page'));
const CustomersPage = lazy(() => import('@/features/customers/pages/customers-page'));
const DebtsPage = lazy(() => import('@/features/debts/pages/debts-page'));
const CashPage = lazy(() => import('@/features/cash/pages/cash-page'));
const ExpensesPage = lazy(() => import('@/features/expenses/pages/expenses-page'));
const ReportsPage = lazy(() => import('@/features/reports/pages/reports-page'));
const StaffPage = lazy(() => import('@/features/staff/pages/staff-page'));
const SettingsPage = lazy(() => import('@/features/settings/pages/settings-page'));
const NotificationsPage = lazy(
  () => import('@/features/notifications/pages/notifications-page'),
);
const DevicesPage = lazy(() => import('@/features/devices/pages/devices-page'));
const ProfilePage = lazy(() => import('@/features/profile/pages/profile-page'));
const StoresPage = lazy(() => import('@/features/stores/pages/stores-page'));
const NotFoundPage = lazy(() => import('./pages/not-found-page'));
const ForbiddenPage = lazy(() => import('./pages/forbidden-page'));

/** Har bir sahifa alohida chunk — birinchi yuklanish yengil bo'lishi uchun. */
function LazyOutlet() {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <Outlet />
    </Suspense>
  );
}

const STORE_ROLES = ['MANAGER', 'ADMIN', 'SELLER'] as const;
const MANAGEMENT = ['MANAGER', 'ADMIN'] as const;

export const router = createBrowserRouter([
  {
    element: <LazyOutlet />,
    children: [
      {
        element: <AuthLayout />,
        children: [{ path: '/login', element: <LoginPage /> }],
      },

      {
        element: <RequireAuth />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { index: true, element: <HomeRedirect /> },

              // Barcha do'kon rollari
              {
                element: <RoleGuard roles={STORE_ROLES} />,
                children: [
                  { path: '/dashboard', element: <DashboardPage /> },
                  { path: '/pos', element: <PosPage /> },
                  { path: '/sales', element: <SalesPage /> },
                  { path: '/products', element: <ProductsPage /> },
                  { path: '/customers', element: <CustomersPage /> },
                  { path: '/debts', element: <DebtsPage /> },
                  { path: '/notifications', element: <NotificationsPage /> },
                ],
              },

              // MANAGER va ADMIN
              {
                element: <RoleGuard roles={MANAGEMENT} />,
                children: [
                  { path: '/categories', element: <CategoriesPage /> },
                  { path: '/inventory', element: <InventoryPage /> },
                  { path: '/cash', element: <CashPage /> },
                  { path: '/expenses', element: <ExpensesPage /> },
                  { path: '/reports', element: <ReportsPage /> },
                  { path: '/staff', element: <StaffPage /> },
                ],
              },

              // Faqat MANAGER
              {
                element: <RoleGuard roles={['MANAGER']} />,
                children: [{ path: '/settings', element: <SettingsPage /> }],
              },

              // Faqat SUPERADMIN
              {
                element: <RoleGuard roles={['SUPERADMIN']} />,
                children: [{ path: '/stores', element: <StoresPage /> }],
              },

              // Hamma uchun
              { path: '/profile', element: <ProfilePage /> },
              { path: '/devices', element: <DevicesPage /> },
            ],
          },
        ],
      },

      { path: '/403', element: <ForbiddenPage /> },
      { path: '/404', element: <NotFoundPage /> },
      { path: '*', element: <Navigate to="/404" replace /> },
    ],
  },
]);

import { checkAuth } from '@/shared/lib/auth-check';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Enforce admin RBAC
  await checkAuth('admin');

  return <>{children}</>;
}

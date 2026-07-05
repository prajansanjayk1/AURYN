import { checkAuth } from '@/shared/lib/auth-check';

export default async function KitchenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Enforce chef/admin RBAC
  await checkAuth('chef');

  return <>{children}</>;
}

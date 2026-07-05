import { checkAuth } from '@/shared/lib/auth-check';

export default async function RunnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Enforce runner/admin RBAC
  await checkAuth('runner');

  return <>{children}</>;
}

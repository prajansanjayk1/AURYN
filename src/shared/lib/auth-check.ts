import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from './auth';

export async function checkAuth(requiredRole?: 'admin' | 'chef' | 'runner') {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('df_session');

  if (!sessionCookie) {
    redirect('/login?error=session_expired');
  }

  const payload = verifyToken(sessionCookie.value);
  if (!payload) {
    redirect('/login?error=session_expired');
  }

  if (requiredRole) {
    if (requiredRole === 'admin' && payload.role !== 'admin') {
      redirect('/login?error=unauthorized');
    }
    if (requiredRole === 'chef' && payload.role !== 'chef' && payload.role !== 'admin') {
      redirect('/login?error=unauthorized');
    }
    if (requiredRole === 'runner' && payload.role !== 'runner' && payload.role !== 'admin') {
      redirect('/login?error=unauthorized');
    }
  }

  return payload;
}

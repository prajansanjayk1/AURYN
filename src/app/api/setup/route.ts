import { NextRequest, NextResponse } from 'next/server';
import { RestaurantRepository } from '@/shared/database/repo';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const results: string[] = [];
  const { searchParams } = new URL(req.url);
  const reset = searchParams.get('reset') === 'true';

  try {
    if (reset) {
      results.push('Initiating database reset & reseed...');
      await RestaurantRepository.forceReseed();
      results.push('Database wiped and reseeded with Kings of Wings data successfully.');
    } else {
      results.push('Initiating Supabase PostgreSQL seeding sequence...');
      await RestaurantRepository.getState();
      results.push('Supabase tables, settings, inventory, and users seeded successfully.');
    }
  } catch (err: any) {
    results.push(`Supabase setup failed: ${err.message}`);
  }

  return NextResponse.json({
    message: reset ? 'Kings of Wings database reset completed.' : 'AURYN Supabase database seeding sequence completed.',
    results
  });
}

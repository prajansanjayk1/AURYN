import { NextResponse } from 'next/server';
import { RestaurantRepository } from '@/shared/database/repo';

export const dynamic = 'force-dynamic';

export async function GET() {
  const results: string[] = [];

  try {
    results.push('Initiating Supabase PostgreSQL seeding sequence...');
    await RestaurantRepository.getState();
    results.push('Supabase tables, settings, inventory, and users seeded successfully.');
  } catch (err: any) {
    results.push(`Supabase seeding failed: ${err.message}`);
  }

  return NextResponse.json({
    message: 'AURYN Supabase database seeding sequence completed.',
    results
  });
}

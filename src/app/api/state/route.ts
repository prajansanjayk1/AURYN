import { NextResponse } from 'next/server';
import { RestaurantRepository } from '@/shared/database/repo';

export async function GET() {
  try {
    const state = await RestaurantRepository.getState();
    return NextResponse.json(state);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

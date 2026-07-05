import { NextResponse } from 'next/server';
import { RestaurantIntelligence } from '@/modules/ai/intelligence';

export async function POST(request: Request) {
  try {
    const { query, sessionId, guestName, context } = await request.json();

    if (!query || !sessionId || !guestName) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const response = await RestaurantIntelligence.chatConcierge(query, sessionId, guestName, context);
    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

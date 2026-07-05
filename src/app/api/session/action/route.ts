import { NextResponse } from 'next/server';
import { RestaurantRepository } from '@/shared/database/repo';
import { broadcastEvent } from '@/shared/lib/broadcast';

export async function POST(request: Request) {
  try {
    const { action, sessionId } = await request.json();

    if (!sessionId || !action) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    let session;
    if (action === 'pay') {
      session = await RestaurantRepository.requestPayment(sessionId);
      broadcastEvent('payment.requested', { sessionId, tableId: session.tableId });
    } else if (action === 'close') {
      session = await RestaurantRepository.closeSession(sessionId);
      broadcastEvent('session.closed', { sessionId, tableId: session.tableId });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ session });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

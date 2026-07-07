import { NextResponse } from 'next/server';
import { RestaurantRepository } from '@/shared/database/repo';
import { broadcastEvent } from '@/shared/lib/broadcast';

export async function POST(request: Request) {
  try {
    const { tableId, guestId, guestName } = await request.json();
    
    if (!tableId || !guestId || !guestName) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const isTakeaway = tableId.toLowerCase() === 'takeaway';
    let session;
    let eventType = 'session.joined';
    let isNew = false;

    if (isTakeaway) {
      session = await RestaurantRepository.createSession('Takeaway', guestId, guestName);
      eventType = 'session.created';
      isNew = true;
    } else {
      const tables = await RestaurantRepository.getTables();
      const table = tables.find(t => t.id === tableId);
      
      if (!table) {
        return NextResponse.json({ error: `Table ${tableId} not found` }, { status: 404 });
      }

      if (table.status === 'available') {
        session = await RestaurantRepository.createSession(tableId, guestId, guestName);
        eventType = 'session.created';
        isNew = true;
      } else {
        const activeSession = (await RestaurantRepository.getSessions()).find(
          s => s.tableId === tableId && s.status !== 'completed'
        );
        if (!activeSession) {
          session = await RestaurantRepository.createSession(tableId, guestId, guestName);
          eventType = 'session.created';
          isNew = true;
        } else {
          // Anti-Spam Single Device Table Lock
          if (activeSession.ownerId !== guestId) {
            return NextResponse.json({ 
              error: 'table_occupied', 
              message: 'This table is currently occupied by another customer. Please scan an available table.' 
            }, { status: 403 });
          }
          session = await RestaurantRepository.joinSession(activeSession.id, guestId, guestName);
        }
      }
    }

    // Broadcast change
    broadcastEvent(eventType, {
      sessionId: session.id,
      tableId,
      guestId,
      guestName,
      isNew
    });

    return NextResponse.json({ session, isNew });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

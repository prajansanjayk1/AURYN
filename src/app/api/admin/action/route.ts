import { NextResponse } from 'next/server';
import { RestaurantRepository } from '@/shared/database/repo';
import { broadcastEvent } from '@/shared/lib/broadcast';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, payload } = body;

    if (!type || !payload) {
      return NextResponse.json({ error: 'Missing type or payload' }, { status: 400 });
    }

    if (type === 'menu.update') {
      const { id, updates } = payload;
      const updatedItem = await RestaurantRepository.updateMenuItem(id, updates);
      broadcastEvent('menu.updated', { id, item: updatedItem });
      return NextResponse.json({ success: true, item: updatedItem });
    } 
    
    else if (type === 'menu.create') {
      const newItem = await RestaurantRepository.createMenuItem(payload);
      broadcastEvent('menu.created', { item: newItem });
      return NextResponse.json({ success: true, item: newItem });
    } 
    
    else if (type === 'menu.delete') {
      const { id } = payload;
      await RestaurantRepository.deleteMenuItem(id);
      broadcastEvent('menu.deleted', { id });
      return NextResponse.json({ success: true });
    } 
    
    else if (type === 'inventory.update') {
      const { id, updates } = payload;
      const updatedItem = await RestaurantRepository.updateInventoryItem(id, updates);
      broadcastEvent('inventory.updated', { id, item: updatedItem });
      return NextResponse.json({ success: true, item: updatedItem });
    } 
    
    else if (type === 'table.create') {
      const { name } = payload;
      const newTable = await RestaurantRepository.createTable(name);
      broadcastEvent('table.created', { table: newTable });
      return NextResponse.json({ success: true, table: newTable });
    } 
    
    else if (type === 'table.delete') {
      const { id } = payload;
      await RestaurantRepository.deleteTable(id);
      broadcastEvent('table.deleted', { id });
      return NextResponse.json({ success: true });
    } 
    
    else {
      return NextResponse.json({ error: 'Unsupported action type' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

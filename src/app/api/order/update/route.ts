import { NextResponse } from 'next/server';
import { RestaurantRepository } from '@/shared/database/repo';
import { broadcastEvent } from '@/shared/lib/broadcast';
import { OrderStatus } from '@/shared/types';

export async function POST(request: Request) {
  try {
    const { orderId, status, runnerId } = await request.json();

    if (!orderId || !status) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Determine delivery route if moving to delivering
    let route: string[] | undefined = undefined;
    if (status === 'delivering') {
      const order = await RestaurantRepository.getOrder(orderId);
      if (order) {
        // Mock a route optimization based on table ID
        const targetTable = order.tableId;
        const otherOrders = (await RestaurantRepository.getOrders()).filter(
          o => o.status === 'ready' && o.id !== orderId
        );
        const otherTables = otherOrders.map(o => `Table ${o.tableId}`);
        
        // Dynamic route: Kitchen -> Other ready tables (max 2) -> Target table
        route = ['Kitchen', ...otherTables.slice(0, 2), `Table ${targetTable}`];
      }
    }

    const order = await RestaurantRepository.updateOrderStatus(
      orderId, 
      status as OrderStatus, 
      runnerId || null,
      route
    );

    // Broadcast update
    broadcastEvent(`order.${status}`, { order });

    return NextResponse.json({ order });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

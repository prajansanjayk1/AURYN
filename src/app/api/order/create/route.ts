import { NextResponse } from 'next/server';
import { RestaurantRepository } from '@/shared/database/repo';
import { RestaurantIntelligence } from '@/modules/ai/intelligence';
import { broadcastEvent } from '@/shared/lib/broadcast';

export async function POST(request: Request) {
  try {
    const { sessionId, tableId, items } = await request.json();

    if (!sessionId || !tableId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Missing or invalid parameters' }, { status: 400 });
    }

    const menu = await RestaurantRepository.getMenuItems();
    const orderItems: any[] = [];

    for (const item of items) {
      const menuItem = menu.find(m => m.id === item.menuItemId);
      if (!menuItem) {
        return NextResponse.json({ error: `Menu item ${item.menuItemId} not found` }, { status: 404 });
      }
      orderItems.push({
        menuItemId: item.menuItemId,
        name: menuItem.name,
        quantity: item.quantity,
        price: menuItem.price
      });
    }

    const createdOrders: any[] = [];

    // Create a separate order ticket for each individual product type
    for (const orderItem of orderItems) {
      const prediction = await RestaurantIntelligence.getKitchenPrediction(orderItem.quantity);
      
      const order = await RestaurantRepository.createOrder(
        sessionId,
        tableId,
        [orderItem],
        prediction
      );

      broadcastEvent('order.created', { order });
      createdOrders.push(order);
    }

    return NextResponse.json({ orders: createdOrders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

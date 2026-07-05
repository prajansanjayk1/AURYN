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
    let totalQuantity = 0;

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
      totalQuantity += item.quantity;
    }

    // AI Prediction
    const prediction = await RestaurantIntelligence.getKitchenPrediction(totalQuantity);

    // Create order
    const order = await RestaurantRepository.createOrder(
      sessionId,
      tableId,
      orderItems,
      prediction
    );

    // Broadcast event
    broadcastEvent('order.created', { order });

    return NextResponse.json({ order });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

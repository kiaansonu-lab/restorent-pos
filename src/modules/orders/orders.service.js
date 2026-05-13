const ordersRepository = require('./orders.repository');
const { getIO } = require('../../sockets/socket.manager');
const notificationService = require('../notifications/notifications.service');
const pool = require('../../database/connection');

class OrdersService {
  async getAllOrders(filters) {
    return await ordersRepository.findWithItems(filters);
  }

  async getOrderById(id) {
    return await ordersRepository.getOrderWithItems(id);
  }

  async createOrder(orderData, items) {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 1. Create Order
      const orderId = await ordersRepository.create(orderData);

      // 2. Create Order Items
      for (const item of items) {
        await connection.execute(
          'INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)',
          [orderId, item.menu_item_id, item.quantity, item.unit_price, item.total_price]
        );
      }

      await connection.commit();

      // 3. Socket Notification
      const io = getIO();
      io.emit('new_order', { id: orderId, order_number: orderData.order_number });
      io.to('chef').emit('new_kitchen_ticket', { orderId });

      // 4. Save Notification
      await notificationService.createNotification({
        notification_type: 'ORDER',
        message: `New Order Received: #${orderData.order_number}`,
        targetRole: 'CHEF'
      });
      
      await notificationService.createNotification({
        notification_type: 'ORDER',
        message: `New Order Placed: #${orderData.order_number}`,
        targetRole: 'ADMIN'
      });

      return orderId;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  async updateOrderStatus(id, status) {
    const result = await ordersRepository.update(id, { order_status: status });
    
    // Socket Notification
    const io = getIO();
    io.emit('order_update', { id, status });

    // Save Notification
    await notificationService.createNotification({
      notification_type: 'ORDER_UPDATE',
      message: `Order #${id} is now ${status}`,
      targetRole: status === 'Ready' ? 'WAITER' : 'ADMIN'
    });
    
    return result;
  }
}

module.exports = new OrdersService();

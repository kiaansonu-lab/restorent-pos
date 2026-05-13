const ordersService = require('./orders.service');
const { sendSuccess, sendError } = require('../../utils/response.formatter');

class OrdersController {
  async getAllOrders(req, res) {
    try {
      const { status, customerId, userId } = req.query;
      const orders = await ordersService.getAllOrders({ status, customerId, userId });
      return sendSuccess(res, 'Orders fetched successfully', orders);
    } catch (err) {
      return sendError(res, err.message);
    }
  }
  async getOrderById(req, res) {
    try {
      const order = await ordersService.getOrderById(req.params.id);
      if (!order) {
        return sendError(res, 'Order not found', 404);
      }
      return sendSuccess(res, 'Order fetched successfully', order);
    } catch (err) {
      return sendError(res, err.message);
    }
  }

  async createOrder(req, res) {
    try {
      const { orderData, items } = req.body;
      const orderId = await ordersService.createOrder(orderData, items);
      return sendSuccess(res, 'Order created successfully', { id: orderId }, 201);
    } catch (err) {
      return sendError(res, err.message);
    }
  }

  async updateStatus(req, res) {
    try {
      const { status } = req.body;
      await ordersService.updateOrderStatus(req.params.id, status);
      return sendSuccess(res, 'Order status updated successfully');
    } catch (err) {
      return sendError(res, err.message);
    }
  }
}

module.exports = new OrdersController();

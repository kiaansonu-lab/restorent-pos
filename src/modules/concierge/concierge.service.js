const conciergeModel = require('./concierge.model');
const pool = require('../../database/connection');
const { getIO } = require('../../sockets/socket.manager');

class ConciergeService {
  async getActiveTickets() {
    return await conciergeModel.findActiveTickets();
  }

  async getTicketMessages(ticketId) {
    return await conciergeModel.getMessages(ticketId);
  }

  async sendMessage(data) {
    const payload = {
      ticket_id: data.ticket_id,
      message: data.message,
      sender_id: data.sender_id || null // null means sent by guest
    };
    
    const messageId = await conciergeModel.createMessage(payload);
    
    // Realtime broadcast to specific ticket room
    const io = getIO();
    const eventData = { 
      ...payload, 
      id: messageId,
      createdAt: new Date().toISOString()
    };
    
    io.to(`ticket_${data.ticket_id}`).emit('new_message', eventData);
    
    // Also notify all staff globally to update their sidebar/chat list
    io.to('staff').emit('new_message', eventData);
    
    return messageId;
  }

  async getOrCreateTicketForGuest(guestId) {
    // 1. Check if guest has an open ticket
    const sql = 'SELECT * FROM support_tickets WHERE guest_id = ? AND ticket_status != "closed" LIMIT 1';
    const [rows] = await pool.execute(sql, [guestId]);
    
    if (rows.length > 0) {
      return rows[0];
    }
    
    // 2. Create new ticket
    const ticketSql = 'INSERT INTO support_tickets (guest_id, ticket_status, ticket_type, subject) VALUES (?, "open", "reception", "Reception Assistance")';
    const [result] = await pool.execute(ticketSql, [guestId]);
    
    return { id: result.insertId, guest_id: guestId, ticket_status: 'open' };
  }
}

module.exports = new ConciergeService();

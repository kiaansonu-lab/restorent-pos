const conciergeService = require('./concierge.service');

class ConciergeController {
  async getTickets(req, res) {
    try {
      const tickets = await conciergeService.getActiveTickets();
      res.json({
        success: true,
        message: 'Tickets fetched successfully',
        data: tickets
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message
      });
    }
  }

  async getMessages(req, res) {
    try {
      const messages = await conciergeService.getTicketMessages(req.params.id);
      res.json({
        success: true,
        message: 'Messages fetched successfully',
        data: messages
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message
      });
    }
  }

  async sendMessage(req, res) {
    try {
      const { ticket_id, message } = req.body;
      const messageId = await conciergeService.sendMessage({
        ticket_id,
        message,
        sender_id: req.user.id
      });
      res.status(201).json({
        success: true,
        message: 'Message sent successfully',
        data: { id: messageId }
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message
      });
    }
  }

  async getGuestTicket(req, res) {
    try {
      const ticket = await conciergeService.getOrCreateTicketForGuest(req.params.guestId);
      res.json({
        success: true,
        data: ticket
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async sendGuestMessage(req, res) {
    try {
      const { ticket_id, message, guest_id } = req.body;
      const messageId = await conciergeService.sendMessage({
        ticket_id,
        message,
        guest_id // Pass guest_id instead of sender_id
      });
      res.status(201).json({
        success: true,
        data: { id: messageId }
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new ConciergeController();

const BaseModel = require('../../database/BaseModel');
const pool = require('../../database/connection');

class RoomsModel extends BaseModel {
  constructor() {
    super('rooms');
  }

  async findAllWithGuestInfo() {
    const sql = `
      SELECT 
        r.*,
        r.room_status as status,
        g.full_name as assignedGuest,
        g.full_name as assigned_guest,
        rb.total_guests as guests_count
      FROM rooms r
      LEFT JOIN room_bookings rb ON r.id = rb.room_id AND r.room_status = 'occupied'
      LEFT JOIN reservations res ON rb.reservation_id = res.id
      LEFT JOIN guests g ON res.guest_id = g.id
      WHERE r.deletedAt IS NULL
      GROUP BY r.id
    `;
    const [rows] = await pool.execute(sql);
    return rows;
  }

  async findAvailable() {
    const sql = `SELECT * FROM rooms WHERE room_status = "available" AND deletedAt IS NULL`;
    const [rows] = await pool.execute(sql);
    return rows;
  }
}

module.exports = new RoomsModel();

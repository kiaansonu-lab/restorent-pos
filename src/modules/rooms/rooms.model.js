const BaseModel = require('../../database/BaseModel');
const pool = require('../../database/connection');

class RoomsModel extends BaseModel {
  constructor() {
    super('rooms');
  }

  async findAvailable() {
    const sql = `SELECT * FROM rooms WHERE room_status = "available" AND deletedAt IS NULL`;
    const [rows] = await pool.execute(sql);
    return rows;
  }
}

module.exports = new RoomsModel();

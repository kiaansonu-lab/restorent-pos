const BaseModel = require('../../database/BaseModel');
const pool = require('../../database/connection');

class AuthModel extends BaseModel {
  constructor() {
    super('users');
  }

  async findWithRole(email) {
    const sql = `
      SELECT u.*, r.role_name 
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE u.email = ? AND u.deletedAt IS NULL
    `;
    const [rows] = await pool.execute(sql, [email]);
    return rows[0];
  }
}

module.exports = new AuthModel();

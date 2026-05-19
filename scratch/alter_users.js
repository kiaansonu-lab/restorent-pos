const pool = require('../src/database/connection');

async function alterTable() {
  try {
    const [cols] = await pool.execute('DESCRIBE users');
    const fields = cols.map(c => c.Field);

    if (!fields.includes('profileImage')) {
      await pool.execute('ALTER TABLE users ADD COLUMN profileImage VARCHAR(255) NULL AFTER avatar');
      console.log('Added profileImage column');
    }

    if (!fields.includes('cart')) {
      await pool.execute('ALTER TABLE users ADD COLUMN cart LONGTEXT NULL AFTER profileImage');
      console.log('Added cart column');
    }

    if (!fields.includes('addresses')) {
      await pool.execute('ALTER TABLE users ADD COLUMN addresses LONGTEXT NULL AFTER cart');
      console.log('Added addresses column');
    }
    
    console.log('Alterations complete or already exist!');
  } catch (err) {
    console.error('Error altering table:', err.message);
  } finally {
    process.exit(0);
  }
}

alterTable();

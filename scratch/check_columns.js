const pool = require('../src/database/connection');

async function checkColumns() {
  try {
    const [userCols] = await pool.execute('DESCRIBE users');
    console.log('users columns:', userCols.map(c => c.Field));

    const [orderCols] = await pool.execute('DESCRIBE orders');
    console.log('orders columns:', orderCols.map(c => c.Field));

    try {
      const [favoritesCols] = await pool.execute('DESCRIBE favorites');
      console.log('favorites columns:', favoritesCols.map(c => c.Field));
    } catch (e) {
      console.log('No favorites table or error:', e.message);
    }

    try {
      const [cartsCols] = await pool.execute('DESCRIBE carts');
      console.log('carts columns:', cartsCols.map(c => c.Field));
    } catch (e) {
      console.log('No carts table or error:', e.message);
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    process.exit(0);
  }
}

checkColumns();

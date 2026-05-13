const express = require('express');
const router = express.Router();
const billingController = require('./billing.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

router.get('/my-bill', billingController.getGuestBill);

router.use(authenticate);

router.get('/', authorize('admin', 'manager', 'cashier'), billingController.getAllBills);
router.post('/:id/settle', authorize('admin', 'manager', 'cashier'), billingController.settleBill);
router.post('/:id/charges', authorize('admin', 'manager', 'cashier'), billingController.addCharge);

module.exports = router;

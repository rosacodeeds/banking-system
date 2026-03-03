const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');

// --- STEP 1: STATIC ROUTES FIRST ---
/**
 * CREATE ACCOUNT
 * URL: POST http://localhost:5000/api/accounts/create
 * We put this FIRST so Express doesn't mistake "/create" for an ID/AccountNumber
 */
router.post('/create', accountController.createAccount);

/**
 * TRANSFER FUNDS
 * URL: POST http://localhost:5000/api/accounts/transfer
 */
router.post('/transfer', accountController.handleTransfer);


// --- STEP 2: DYNAMIC (PARAMETER) ROUTES SECOND ---
/**
 * GET ACCOUNT BALANCE
 * URL: GET http://localhost:5000/api/accounts/:accountNumber/balance
 */
router.get('/:accountNumber/balance', accountController.getBalance);

/**
 * DEPOSIT
 * URL: POST http://localhost:5000/api/accounts/:accountNumber/deposit
 */
router.post('/:accountNumber/deposit', accountController.handleDeposit);

/**
 * WITHDRAW
 * URL: POST http://localhost:5000/api/accounts/:accountNumber/withdraw
 */
router.post('/:accountNumber/withdraw', accountController.handleWithdraw);

module.exports = router;
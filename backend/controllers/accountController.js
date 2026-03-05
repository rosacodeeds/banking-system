const pool = require('../config/db');
const { transferFunds } = require('../services/bankingService');

/**
 * 0. CREATE ACCOUNT
 * Includes validation to ensure the PIN is exactly 4 numeric digits.
 */
exports.createAccount = async (req, res) => {
    const { accountNumber, initialBalance, pin } = req.body;

    // --- NEW VALIDATION LOGIC ---
    // This Regex checks: Does the pin consist of exactly 4 digits (0-9)?
    const pinRegex = /^\d{4}$/;

    if (!accountNumber || !pin) {
        return res.status(400).json({ error: "Account Number and PIN are required" });
    }

    if (!pinRegex.test(pin)) {
        return res.status(400).json({ error: "Invalid PIN format. Must be exactly 4 digits (0-9)." });
    }
    // ----------------------------

    try {
        const result = await pool.query(
            'INSERT INTO accounts (account_number, balance, pin) VALUES ($1, $2, $3) RETURNING id, account_number, balance, pin',
            [accountNumber, initialBalance || 0, pin]
        );
        res.status(201).json({
            message: "Account created successfully",
            account: {
                accountNumber: result.rows[0].account_number,
                balance: parseFloat(result.rows[0].balance),
                pin: result.rows[0].pin
            }
        });
    } catch (err) {
        console.error("CREATE ERROR:", err.message);
        if (err.code === '23505') return res.status(400).json({ error: "Account already exists" });
        res.status(500).json({ error: "Database error" });
    }
};

/**
 * 1. GET ACCOUNT BALANCE
 */
exports.getBalance = async (req, res) => {
    try {
        const { accountNumber } = req.params;
        const result = await pool.query(
            'SELECT account_number, balance, pin FROM accounts WHERE account_number = $1', 
            [accountNumber]
        );
        if (result.rowCount === 0) return res.status(404).json({ error: "Account not found" });
        res.json({
            accountNumber: result.rows[0].account_number,
            balance: parseFloat(result.rows[0].balance),
            pin: result.rows[0].pin
        });
    } catch (err) {
        res.status(500).json({ error: "Database error" });
    }
};

/**
 * 2. DEPOSIT
 */
exports.handleDeposit = async (req, res) => {
    const { accountNumber } = req.params;
    const { amount } = req.body;
    try {
        if (amount <= 0) throw new Error("Amount must be > 0");
        const result = await pool.query(
            'UPDATE accounts SET balance = balance + $1 WHERE account_number = $2 RETURNING id, balance',
            [amount, accountNumber]
        );
        if (result.rowCount === 0) return res.status(404).json({ error: "Account not found" });
        
        await pool.query(
            'INSERT INTO transactions (account_id, type, amount, reference) VALUES ($1, $2, $3, $4)',
            [result.rows[0].id, 'DEPOSIT', amount, 'Standard Deposit']
        );
        res.json({ message: "Deposit successful", updatedBalance: parseFloat(result.rows[0].balance) });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

/**
 * 3. WITHDRAW
 */
exports.handleWithdraw = async (req, res) => {
    const { accountNumber } = req.params;
    const { amount } = req.body;
    try {
        if (amount <= 0) throw new Error("Amount must be > 0");
        const result = await pool.query(
            'UPDATE accounts SET balance = balance - $1 WHERE account_number = $2 AND balance >= $1 RETURNING id, balance',
            [amount, accountNumber]
        );
        if (result.rowCount === 0) return res.status(400).json({ error: "Insufficient funds" });
        
        await pool.query(
            'INSERT INTO transactions (account_id, type, amount, reference) VALUES ($1, $2, $3, $4)',
            [result.rows[0].id, 'WITHDRAW', amount, 'Standard Withdraw']
        );
        res.json({ message: "Withdraw successful", updatedBalance: parseFloat(result.rows[0].balance) });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

/**
 * 4. TRANSFER
 */
exports.handleTransfer = async (req, res) => {
    const { fromAccount, toAccount, amount } = req.body;
    try {
        await transferFunds(fromAccount, toAccount, amount);
        res.json({ message: "Transfer successful" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};
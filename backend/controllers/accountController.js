const pool = require('../config/db');
const { transferFunds } = require('../services/bankingService');

/**
 * CREATE ACCOUNT
 * Matches React: setAccountInfo(res.data.account)
 */
exports.createAccount = async (req, res) => {
    const { accountNumber, initialBalance } = req.body;
    try {
        // Insert into DB using snake_case
        const result = await pool.query(
            'INSERT INTO accounts (account_number, balance) VALUES ($1, $2) RETURNING id, account_number, balance',
            [accountNumber, initialBalance || 0]
        );

        // Return to React using camelCase
        res.json({
            message: "Account created successfully",
            account: {
                accountNumber: result.rows[0].account_number,
                balance: parseFloat(result.rows[0].balance)
            }
        });
    } catch (err) {
        console.error("CREATE ERROR:", err.message);
        res.status(400).json({ error: "Account already exists or invalid data" });
    }
};

/**
 * 1. GET ACCOUNT BALANCE
 * Matches React: setAccountInfo(res.data)
 */
exports.getBalance = async (req, res) => {
    try {
        const { accountNumber } = req.params;
        const result = await pool.query(
            'SELECT account_number, balance FROM accounts WHERE account_number = $1', 
            [accountNumber]
        );
        
        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Account not found" });
        }
        
        // Return keys that match your React state properties
        res.json({
            accountNumber: result.rows[0].account_number,
            balance: parseFloat(result.rows[0].balance)
        });
    } catch (err) {
        console.error("GET BALANCE ERROR:", err);
        res.status(500).json({ error: "Database error" });
    }
};

/**
 * 2. DEPOSIT
 * Matches React: handleAction('deposit')
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

        // Log transaction
        await pool.query(
            'INSERT INTO transactions (account_id, type, amount, reference) VALUES ($1, $2, $3, $4)',
            [result.rows[0].id, 'DEPOSIT', amount, 'Standard Deposit']
        );

        res.json({ message: "Deposit successful", updatedBalance: parseFloat(result.rows[0].balance) });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// ... keep handleWithdraw and handleTransfer the same as your previous version
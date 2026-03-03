const pool = require('../config/db');

const transferFunds = async (fromAcc, toAcc, amount) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // START TRANSACTION

        // 1. Rule: Amount must be > 0
        if (amount <= 0) throw new Error("Amount must be greater than zero");

        // 2. Both accounts must exist
        const senderRes = await client.query('SELECT id, balance FROM accounts WHERE account_number = $1', [fromAcc]);
        const receiverRes = await client.query('SELECT id FROM accounts WHERE account_number = $1', [toAcc]);

        if (senderRes.rowCount === 0) throw new Error("Sender account not found");
        if (receiverRes.rowCount === 0) throw new Error("Receiver account not found");
        if (fromAcc === toAcc) throw new Error("Cannot transfer to the same account");

        const senderId = senderRes.rows[0].id;
        const receiverId = receiverRes.rows[0].id;
        const senderBalance = parseFloat(senderRes.rows[0].balance);

        // 3. Sender must have sufficient balance
        if (senderBalance < amount) throw new Error("Insufficient funds");

        // 4. Update balances safely
        await client.query('UPDATE accounts SET balance = balance - $1 WHERE account_number = $2', [amount, fromAcc]);
        await client.query('UPDATE accounts SET balance = balance + $1 WHERE account_number = $2', [amount, toAcc]);

        // 5. Maintain history (Logs for BOTH accounts)
        // Record for Sender
        await client.query(
            'INSERT INTO transactions (account_id, type, amount, reference) VALUES ($1, $2, $3, $4)', 
            [senderId, 'TRANSFER_OUT', amount, `To: ${toAcc}`]
        );
        // Record for Receiver
        await client.query(
            'INSERT INTO transactions (account_id, type, amount, reference) VALUES ($1, $2, $3, $4)', 
            [receiverId, 'TRANSFER_IN', amount, `From: ${fromAcc}`]
        );

        await client.query('COMMIT'); // Consistency: Save all changes
        return { success: true, message: "Transfer successful" };
    } catch (err) {
        await client.query('ROLLBACK'); // Fail-safe: Undo everything if error
        throw err;
    } finally {
        client.release();
    }
};

module.exports = { transferFunds };
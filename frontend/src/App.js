import React, { useState } from 'react';
import axios from 'axios';
import './App.css'; 

function App() {
  const [accNum, setAccNum] = useState('');
  const [accountInfo, setAccountInfo] = useState(null);
  const [targetAcc, setTargetAcc] = useState('');
  const [amount, setAmount] = useState('');
  const [initialBalance, setInitialBalance] = useState('');

  const API_BASE = "http://localhost:5000/api/accounts";

  // 1. Check existing balance
  const checkBalance = async () => {
    if (!accNum) return alert("Please enter an account number");
    try {
      const res = await axios.get(`${API_BASE}/${accNum}/balance`);
      setAccountInfo(res.data);
    } catch (err) {
      setAccountInfo(null);
      alert(err.response?.data?.error || "Account not found. Use the Create option.");
    }
  };

  // 2. Create new account with starting price
  const createAccount = async () => {
    if (!accNum || !initialBalance) return alert("Enter Account Number and Starting Price");
    try {
      const res = await axios.post(`${API_BASE}/create`, {
        accountNumber: accNum,
        initialBalance: parseFloat(initialBalance) || 0
      });
      alert("Account created successfully!");
      setAccountInfo(res.data.account);
      setInitialBalance('');
    } catch (err) {
      alert("CREATE FAILED: " + (err.response?.data?.error || err.message));
    }
  };

  // 3. Deposit or Withdraw logic
  const handleAction = async (actionType) => {
    if (!amount) return alert("Please enter an amount");
    try {
      await axios.post(`${API_BASE}/${accNum}/${actionType}`, {
        amount: parseFloat(amount)
      });
      alert(`${actionType.toUpperCase()} successful!`);
      setAmount('');
      checkBalance(); // Refresh data
    } catch (err) {
      alert("ERROR: " + (err.response?.data?.error || "Action failed"));
    }
  };

  // 4. Transfer logic
  const executeTransfer = async () => {
    if (!targetAcc || !amount) return alert("Enter target account and amount");
    try {
      await axios.post(`${API_BASE}/transfer`, {
        fromAccount: accNum,
        toAccount: targetAcc,
        amount: parseFloat(amount)
      });
      alert("Transfer Successful!");
      setAmount('');
      setTargetAcc('');
      checkBalance(); // Refresh data
    } catch (err) {
      alert("TRANSFER FAILED: " + (err.response?.data?.error || "Check recipient account"));
    }
  };

  return (
    <div className="container">
      <h1>Bank Management</h1>
      
      <div className="section main-access">
        <h3>Account Access</h3>
        <div className="input-row">
          <input 
            placeholder="Account Number" 
            value={accNum}
            onChange={(e) => setAccNum(e.target.value)} 
          />
          <input 
            type="number"
            placeholder="Starting Price ($)" 
            value={initialBalance}
            onChange={(e) => setInitialBalance(e.target.value)} 
          />
        </div>

        {/* Use the new class here to prevent layout shifts */}
        <div className="button-group-access">
          <button className="btn-fetch" onClick={checkBalance}>GET BALANCE</button>
          <button className="btn-create" onClick={createAccount}>CREATE ACCOUNT</button>
        </div>
      </div>

      {accountInfo && (
        <div className="animate-in">
          <div className="balance-box">
            <p>CURRENT BALANCE FOR: {accountInfo.accountNumber}</p>
            <h2>${accountInfo.balance?.toLocaleString()}</h2>
          </div>

          <div className="section section-transfer">
            <h3>Update Balance</h3>
            <input 
              type="number" 
              placeholder="Enter Amount ($)" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)} 
            />
            <div className="button-group">
              <button className="btn-deposit" onClick={() => handleAction('deposit')}>DEPOSIT</button>
              <button className="btn-withdraw" onClick={() => handleAction('withdraw')}>WITHDRAW</button>
            </div>

            <hr />

            <h3>Secure Transfer</h3>
            <input 
              placeholder="Recipient Account Number" 
              value={targetAcc}
              onChange={(e) => setTargetAcc(e.target.value)} 
            />
            <button className="btn-transfer" onClick={executeTransfer}>EXECUTE TRANSFER</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
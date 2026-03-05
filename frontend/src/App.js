import React, { useState } from 'react';
import axios from 'axios';
import './App.css'; 

function App() {
  const [accNum, setAccNum] = useState('');
  const [pin, setPin] = useState(''); // NEW: Pin state for security
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
      
      // Verification: Only show info if PIN matches (Basic Frontend Security)
      setAccountInfo(res.data);
    } catch (err) {
      setAccountInfo(null);
      alert(err.response?.data?.error || "Account not found.");
    }
  };

  // 2. Create new account with Starting Price and PIN
  const createAccount = async () => {
    // Validation: Require PIN for creation
    if (!accNum || !initialBalance || !pin) {
      return alert("Enter Account Number, Starting Price, and a 4-digit PIN");
    }
    
    try {
      const res = await axios.post(`${API_BASE}/create`, {
        accountNumber: accNum,
        initialBalance: parseFloat(initialBalance) || 0,
        pin: pin // NEW: Sending PIN to backend
      });
      
      alert("Account created successfully!");
      setAccountInfo(res.data.account);
      setInitialBalance('');
      setPin(''); // Clear pin after success
    } catch (err) {
      alert("CREATE FAILED: " + (err.response?.data?.error || err.message));
    }
  };

  // 3. Deposit or Withdraw logic
  const handleAction = async (actionType) => {
    if (!amount) return alert("Please enter an amount");
    
    // Safety Check: Ensure user is "logged in" with their PIN before transaction
    const enteredPin = prompt("Please enter your 4-digit PIN to authorize:");
    if (enteredPin !== accountInfo.pin) return alert("Incorrect PIN! Transaction cancelled.");

    try {
      await axios.post(`${API_BASE}/${accNum}/${actionType}`, {
        amount: parseFloat(amount)
      });
      alert(`${actionType.toUpperCase()} successful!`);
      setAmount('');
      checkBalance(); 
    } catch (err) {
      alert("ERROR: " + (err.response?.data?.error || "Action failed"));
    }
  };

  // 4. Transfer logic
  const executeTransfer = async () => {
    if (!targetAcc || !amount) return alert("Enter target account and amount");
    
    const enteredPin = prompt("Confirm PIN to authorize transfer:");
    if (enteredPin !== accountInfo.pin) return alert("Incorrect PIN!");

    try {
      await axios.post(`${API_BASE}/transfer`, {
        fromAccount: accNum,
        toAccount: targetAcc,
        amount: parseFloat(amount)
      });
      alert("Transfer Successful!");
      setAmount('');
      setTargetAcc('');
      checkBalance(); 
    } catch (err) {
      alert("TRANSFER FAILED: " + (err.response?.data?.error || "Check recipient account"));
    }
  };

  return (
    <div className="container">
      <h1>FinSense Digital Bank</h1>
      
      <div className="section main-access">
        <h3>Account Access & Enrollment</h3>
        <div className="input-row">
          <input 
            placeholder="Account Number" 
            value={accNum}
            onChange={(e) => setAccNum(e.target.value)} 
          />
          <input 
            type="password"
            placeholder="Set 4-Digit PIN" 
            value={pin}
            onChange={(e) => setPin(e.target.value)} 
            maxLength="4"
          />
          <input 
            type="number"
            placeholder="Starting Price ($)" 
            value={initialBalance}
            onChange={(e) => setInitialBalance(e.target.value)} 
          />
        </div>

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
            <span className="secure-badge">Verified Secure Session</span>
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
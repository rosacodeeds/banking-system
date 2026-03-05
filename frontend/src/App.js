import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css'; 

function App() {
  const [accNum, setAccNum] = useState('');
  const [pin, setPin] = useState('');
  const [accountInfo, setAccountInfo] = useState(null);
  const [targetAcc, setTargetAcc] = useState('');
  const [amount, setAmount] = useState('');
  const [initialBalance, setInitialBalance] = useState('');

  const API_BASE = "http://localhost:5000/api/accounts";

  // EFFECT HOOK: Load the account number from Local Storage on startup
  useEffect(() => {
    const savedAccount = localStorage.getItem('finSense_lastAccount');
    if (savedAccount) {
      setAccNum(savedAccount);
    }
  }, []);

  // CHECK BALANCE: Now saves the account number to Local Storage
  const checkBalance = async () => {
    if (!accNum) return alert("Please enter an account number");
    try {
      const res = await axios.get(`${API_BASE}/${accNum}/balance`);
      setAccountInfo(res.data);
      
      // Persist account number (Success path)
      localStorage.setItem('finSense_lastAccount', accNum);
    } catch (err) {
      setAccountInfo(null);
      alert(err.response?.data?.error || "Account not found.");
    }
  };

  // CREATE ACCOUNT: Now saves the new account number to Local Storage
  const createAccount = async () => {
    if (!accNum || !initialBalance || !pin) {
      return alert("Enter Account Number, Starting Price, and a 4-digit PIN");
    }

    // Double check PIN length before sending to backend
    if (pin.length !== 4) return alert("PIN must be exactly 4 digits");
    
    try {
      const res = await axios.post(`${API_BASE}/create`, {
        accountNumber: accNum,
        initialBalance: parseFloat(initialBalance) || 0,
        pin: pin 
      });
      
      alert("Account created successfully!");
      setAccountInfo(res.data.account);
      
      // Persist account number
      localStorage.setItem('finSense_lastAccount', accNum);
      
      setInitialBalance('');
      setPin(''); 
    } catch (err) {
      alert("CREATE FAILED: " + (err.response?.data?.error || err.message));
    }
  };

  const handleAction = async (actionType) => {
    if (!amount) return alert("Please enter an amount");
    const enteredPin = prompt("Please enter your 4-digit PIN to authorize:");
    
    // Authorization check
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

  const executeTransfer = async () => {
    if (!targetAcc || !amount) return alert("Enter target account and amount");
    const enteredPin = prompt("Confirm PIN to authorize transfer:");
    
    // Authorization check
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
          
          {/* UPDATED PIN INPUT: Only allows digits */}
          <input 
            type="password"
            placeholder="Set 4-Digit PIN" 
            value={pin}
            onChange={(e) => {
              const val = e.target.value;
              // REGEX: Only updates state if the typed value is empty OR contains only digits
              if (val === '' || /^\d+$/.test(val)) {
                setPin(val);
              }
            }} 
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
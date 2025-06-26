import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import { useUserData } from "../../../../contexts/UserDataProvider.js";
import { useAuth } from "../../../../contexts/AuthProvider.js";
import { useWallet } from "../../../../contexts/WalletProvider.js";

import './CryptoPaymentModal.css';

export const CryptoPaymentModal = ({ isOpen, onClose, totalAmount, orderAddress }) => {
  const [currentStep, setCurrentStep] = useState('connect'); // connect, confirm, processing
  
  const { isConnected, walletAddress, balance, connectWallet, disconnectWallet, simulateTransaction, calculateCryptoAmount, calculateGasFees } = useWallet();
  const { userDataState, dispatch, clearCartHandler } = useUserData();
  const { auth, setCurrentPage } = useAuth();
  const navigate = useNavigate();

  const { cartProducts } = userDataState;

  const cryptoAmount = calculateCryptoAmount(totalAmount, "ETH");
  const gasFee = calculateGasFees("ETH");
  const total = (parseFloat(cryptoAmount) + parseFloat(gasFee)).toFixed(6);
  const [calculatedAmounts, setCalculatedAmounts] = useState({
    cryptoAmount,
    gasFee,
    total
  });
  

  const handleConnectWallet = async () => {
    try {
      setCurrentStep('connecting');
      await connectWallet();
      setCurrentStep('confirm');
    } catch (error) {
      toast.error('Failed to connect wallet');
      setCurrentStep('connect');
    }
  };

  const handleConfirmPayment = async () => {
    if (!orderAddress) {
      toast.error('Please select a delivery address');
      return;
    }

    setCurrentStep('processing');

    try {
      const result = await simulateTransaction(totalAmount, 'ETH');
      
      if (result.success) {
        setCalculatedAmounts({
          cryptoAmount: result.cryptoAmount,
          gasFee: result.gasFee,
          total: result.totalPaid
        })
        const orderId = uuid();
        const order = {
          paymentId: result.hash,
          orderId,
          amountPaid: totalAmount,
          orderedProducts: [...cartProducts],
          deliveryAddress: { ...orderAddress },
          paymentMethod: 'crypto',
          cryptocurrency: 'ETH',
          cryptoAmount: calculatedAmounts.cryptoAmount,
          gasFee: calculatedAmounts.gasFee,
          totalPaid: calculatedAmounts.total
        };

        dispatch({ type: "SET_ORDERS", payload: order });
        clearCartHandler(auth.token);
        setCurrentPage("orders");
        navigate("/profile/orders");
        onClose();
        
        toast.success('Payment successful!');
      }
    } catch (error) {
      toast.error(error.message);
      setCurrentStep('confirm');
    }
  };

  const handleDisconnectAndClose = () => {
    disconnectWallet();
    setCurrentStep('connect');
    onClose();
  };

  const renderConnectStep = () => (
    <div className="crypto-step">
      <h3>Connect Your Crypto Wallet</h3>
      <p>Connect your wallet to pay with cryptocurrency</p>
      
      <div className="wallet-options">
        <button 
          className="wallet-option"
          onClick={handleConnectWallet}
          disabled={currentStep === 'connecting'}
        >
          <span className="wallet-icon">🦊</span>
          <span>MetaMask</span>
        </button>
        
        <button 
          className="wallet-option"
          onClick={handleConnectWallet}
          disabled={currentStep === 'connecting'}
        >
          <span className="wallet-icon">🔵</span>
          <span>Coinbase Wallet</span>
        </button>
        
        <button 
          className="wallet-option"
          onClick={handleConnectWallet}
          disabled={currentStep === 'connecting'}
        >
          <span className="wallet-icon">🛡️</span>
          <span>Trust Wallet</span>
        </button>
      </div>

      {currentStep === 'connecting' && (
        <div className="connecting-state">
          <div className="spinner"></div>
          <p>Connecting wallet...</p>
        </div>
      )}
    </div>
  );

  const renderConfirmStep = () => (
    <div className="crypto-step">
      <div className="wallet-info">
        <h3>Wallet Connected</h3>
        <p className="wallet-address">
          {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
        </p>
        <p className="wallet-balance">Balance: {balance} ETH</p>
        <button 
          className="disconnect-btn"
          onClick={handleDisconnectAndClose}
        >
          Disconnect
        </button>
      </div>

      <div className="payment-details">
        <h4>Payment Details</h4>

        <div className="amount-breakdown">
          <div className="amount-row">
            <span>Total (USD):</span>
            <span>${totalAmount}</span>
          </div>
          <div className="amount-row">
            <span>Amount (ETH):</span>
            <span>{calculatedAmounts.cryptoAmount} ETH</span>
          </div>
          <div className="amount-row">
            <span>Gas Fees:</span>
            <span>{calculatedAmounts.gasFee} ETH</span>
          </div>
          <div className="amount-row total-row">
            <span>Total (ETH):</span>
            <span>{calculatedAmounts.total} ETH</span>
          </div>
        </div>

        <button 
          className="confirm-payment-btn"
          onClick={handleConfirmPayment}
        >
          Confirm Payment
        </button>
      </div>
    </div>
  );

  const renderProcessingStep = () => (
    <div className="crypto-step processing-step">
      <div className="processing-animation">
        <div className="spinner large"></div>
      </div>
      <h3>Processing Payment</h3>
      <p>Please wait while your transaction is being processed on the blockchain...</p>
      <div className="processing-details">
        <p>This usually takes 10-30 seconds</p>
        <p>Do not close this window</p>
      </div>
    </div>
  );

  return (
    <div className="crypto-modal-overlay">
      <div className="crypto-modal">
        <div className="crypto-modal-header">
          <h2>Pay with Crypto</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="crypto-modal-body">
          {currentStep === 'connect' && renderConnectStep()}
          {currentStep === 'connecting' && renderConnectStep()}
          {(currentStep === 'confirm' && isConnected) && renderConfirmStep()}
          {currentStep === 'processing' && renderProcessingStep()}
        </div>
      </div>
    </div>
  );
};
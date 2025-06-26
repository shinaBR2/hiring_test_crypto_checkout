import { createContext, useContext, useState } from "react";
import { toast } from "react-hot-toast";

const WalletContext = createContext();

const exchangeRates = {
  ETH: 2500, // 1 ETH = $2500
};

const calculateCryptoAmount = (totalAmount) => {
  const rate = exchangeRates["ETH"];
  const cryptoAmount = totalAmount / rate;
  return cryptoAmount.toFixed(6);
};

const calculateGasFees = () => {
  const mockGasFees = {
    ETH: (Math.random() * 0.01 + 0.002).toFixed(6),
  };
  return parseFloat(mockGasFees["ETH"] || mockGasFees.ETH);
};

export function WalletProvider({ children }) {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [balance, setBalance] = useState("0.00");

  const connectWallet = async () => {
    return new Promise((resolve, reject) => {
      toast.loading("Connecting wallet...", { duration: 1000 });

      setTimeout(() => {
        try {
          const fakeAddress =
            "0x" +
            Array(40)
              .fill(0)
              .map(() => Math.floor(Math.random() * 16).toString(16))
              .join("");
          const fakeBalance = (Math.random() * 10).toFixed(4);

          setWalletAddress(fakeAddress);
          setBalance(fakeBalance);
          setIsConnected(true);
          toast.success("Wallet connected successfully!");
          resolve({ success: true });
        } catch (error) {
          reject(error);
        }
      }, 1500);
    });
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setWalletAddress("");
    setBalance("0.00");
    toast.success("Wallet disconnected");
    return { success: true };
  };

  const simulateTransaction = async (amount, cryptoType = "ETH") => {
    const numAmount = parseFloat(amount);
    const numBalance = parseFloat(balance);

    if (isNaN(numAmount) || numAmount <= 0) {
      throw new Error("Invalid transaction amount");
    }

    const cryptoAmount = calculateCryptoAmount(numAmount, cryptoType);
    const gasFee = calculateGasFees(cryptoType);
    const totalAmount = (parseFloat(cryptoAmount) + parseFloat(gasFee)).toFixed(
      6
    );

    if (totalAmount > numBalance) {
      throw new Error(
        `Insufficient balance. Need ${totalAmount.toFixed(
          6
        )} ${cryptoType} (including gas)`
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 2500));
    const success = Math.random() > 0.1;

    if (!success) {
      throw new Error("Transaction failed. Please try again.");
    }

    setBalance((prev) => (parseFloat(prev) - totalAmount).toFixed(6));

    return {
      success: true,
      hash:
        "0x" +
        Array(64)
          .fill(0)
          .map(() => Math.floor(Math.random() * 16).toString(16))
          .join(""),
      gasFee: gasFee,
      totalPaid: totalAmount,
    };
  };

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        walletAddress,
        balance,
        connectWallet,
        disconnectWallet,
        simulateTransaction,
        calculateCryptoAmount,
        calculateGasFees,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => useContext(WalletContext);

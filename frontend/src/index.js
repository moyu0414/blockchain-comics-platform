import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
} from "react-router-dom";
import Home from './routes/Home';
import Reader from './routes/reader';
import Creator from './routes/creator';
import Dual from './routes/dual';
import Identity from './routes/identity';
import CreateWork from './routes/createWork';
import WorkManagement from './routes/workManagement';
import SelectChapter from './routes/selectChapter';
import Navbar from "./components/Navbar";
import Web3 from 'web3';
import createWork from "./contracts/CreateWork_New.json"
import { Buffer } from 'buffer';
import bs58 from 'bs58';



const AppLayout = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [web3Instance, setWeb3Instance] = useState(null);
  const [contractInstance, setContractInstance] = useState(null);
  const [voteId, setVoteId] = useState(null);
  const [account, setAccount] = useState('');

  // 處理登錄狀態的函數
  const handleLogin = () => {
    setIsLoggedIn(true);
    // 其他處理邏輯，例如登錄成功後的操作
  };

  useEffect(() => {
    // 初始化 Web3 和智能合約
    const connectToWeb3 = async () => {
      if (window.ethereum) {
        try {
          // 請求用戶授權
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          const web3Instance = new Web3(window.ethereum);
          setWeb3Instance(web3Instance);

          // 獲取用戶帳戶
          const accounts = await web3Instance.eth.getAccounts();
          setAccount(accounts[0]);

          // 創建合約實例，需替換為您的合約地址
          const contractInstance = new web3Instance.eth.Contract(createWork.abi, createWork.address);
          setContractInstance(contractInstance);
        } catch (error) {
          console.error(error);
        }
      } else {
        alert('請安裝 MetaMask 或其他支援的錢包');
      }
    };

    // 初始化 Web3 和智能合約
    connectToWeb3();

    // 處理登錄狀態
    handleLogin();
  }, []);

  return (
    <>
      {isLoggedIn && <Navbar accounts={accounts} setAccounts={setAccounts} />}
      <Outlet />
    </>
  );
};

// 將 32 bytes 還原成 CID
function getIpfsHashFromBytes32(bytes32Hex) {
  // and cut off leading "0x"
  const hashHex = "1220" + bytes32Hex.slice(2);
  //console.log(hashHex);
  const hashBytes = Buffer.from(hashHex, 'hex');
  //console.log(hashBytes);
  const hashStr = bs58.encode(hashBytes)
  return hashStr
};

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      {
        path: "/",
        element: <Home contractAddress={createWork.address} />,
      },
      {
        path: "/reader",
        element: <Reader />,
      },
      {
        path: "/creator",
        element: <Creator />,
      },
      {
        path: "/dual",
        element: <Dual />,
      },
      {
        path: "/identity",
        element: <Identity />,
      },{
        path: "/createWork",
        element: <CreateWork />,
      },{
        path: "/workManagement",
        element: <WorkManagement />,
      },{
        path: "/selectChapter/:hash",
        element: <SelectChapter />,
      }
    ],
  },
]);

// 渲染應用程序
createRoot(document.getElementById("root")).render(
  <RouterProvider router={router} />
);

export {getIpfsHashFromBytes32};
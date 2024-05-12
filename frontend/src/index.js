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
import comicData from "./contracts/ComicPlatform.json"
import { Buffer } from 'buffer';
import bs58 from 'bs58';

let comicDatas = [];
let num = 1;

const AppLayout = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [web3Instance, setWeb3Instance] = useState(null);
  const [contractInstance, setContractInstance] = useState(null);
  const [voteId, setVoteId] = useState(null);
  const [account, setAccount] = useState('');
  const [imgURL, setImgURL] = useState([]);

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
          const contractInstance = new web3Instance.eth.Contract(comicData.abi, comicData.address);
          setContractInstance(contractInstance);

          const meta = await contractInstance.methods;
          //console.log(meta);
          let allComicHashes = await meta.getAllComicHashes().call(); // 所有漫畫 Hash
          //console.log(allComicHashes);
          //console.log(allComicHashes[0].length);
          for (var i = 0; i < allComicHashes[0].length; i++) {
            let temp_title = allComicHashes[1][i];
            //let temp_title = ComicTitle[1];
            let temp_hash = allComicHashes[0][i];
            let temp_cid = getIpfsHashFromBytes32(temp_hash);
            let isBeing = "https://apricot-certain-boar-955.mypinata.cloud/ipfs/" + temp_cid;
            let id = 'Comic' + num  ;
            //console.log("id：" + id);
            //console.log("temp_hash：" + temp_hash);
            //console.log("isBeing：" + isBeing);
            //console.log("temp_title：" + temp_title);

            // 判斷漫畫網址是否存在
            imgURL.push(isBeing);
            await Promise.all(imgURL.map(imageExists))
            .then(function(results) {
              if (results[i]) {
                //console.log(results);
                comicDatas.push({comicID: id, hash: temp_hash, cid: isBeing, title: temp_title }); // 將 hash 和對應的 cid 放入陣列中
              }
            });
            num = num + 1;
          }

          console.log(comicDatas);
          //localStorage.setItem('web3Instance', 'contractInstance', 'comicDatas', JSON.stringify(comicDatas));
          //要刪除可以用下列的程式
          //localStorage.removeItem('web3Instance', 'contractInstance', 'comicDatas');
          localStorage.setItem('comicDatas', JSON.stringify(comicDatas));

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
  const hashHex = "1220" + bytes32Hex.slice(2);
  const hashBytes = Buffer.from(hashHex, 'hex');
  const hashStr = bs58.encode(hashBytes)
  return hashStr
};


function imageExists(url) {
  return new Promise(function(resolve, reject) {
      fetch(url, { method: 'HEAD' })
          .then(function(response) {
              resolve(response.ok);
          })
          .catch(function() {
              resolve(false);
          });
  });
};



const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      {
        path: "/",
        element: <Home contractAddress={comicData.address}  />,
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
        path: "/selectChapter/:comicID",
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
import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
} from "react-router-dom";
import Home from './routes/Home';
import Navbar from "./components/Navbar";
import Reader from './routes/reader';
import Creator from './routes/creator';
import Dual from './routes/dual';
import CreateWork from './routes/createWork';
import WorkManagement from './routes/workManagement';
import ChapterManagement from './routes/chapterManagement';
import SelectChapter from './routes/selectChapter';
import ReaderChapter from './routes/reader_Chapter';
import Reading from './routes/reading';
import TransactionHistory from './routes/transactionHistory';
import PurchaseHistory from './routes/purchaseHistory';
import Web3 from 'web3';
import comicData from "./contracts/ComicPlatform.json"
import { Buffer } from 'buffer';
import bs58 from 'bs58';

let comicDatas = [];
let purchaseData = [];
let num = 1;

const AppLayout = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [web3Instance, setWeb3Instance] = useState(null);
  const [contractInstance, setContractInstance] = useState(null);
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
          const account = await web3Instance.eth.getAccounts();
          setAccount(account[0]);

          // 創建合約實例，需替換為您的合約地址
          const contractInstance = new web3Instance.eth.Contract(comicData.abi, comicData.address);
          setContractInstance(contractInstance);
          const meta = await contractInstance.methods;
          let allComicHashes = await meta.getAllComicHashes().call(); // 所有漫畫 Hash
          comicDatas.push({nowAccount: account[0]});  //加入目前帳戶
          for (var i = 0; i < allComicHashes[0].length; i++) {
            let temp_title = allComicHashes[1][i];
            let temp_hash = allComicHashes[0][i];
            let temp_cid = getIpfsHashFromBytes32(temp_hash);
            let isBeing = "https://apricot-certain-boar-955.mypinata.cloud/ipfs/" + temp_cid + "?pinataGatewayToken=DlQddJX0ZBG74RznFKeBXWq0i24fOuD8ktnJMofUAYUuBlmhKKtKs01175WVvh5N";
            //let isBeing = "https://indigo-glad-rhinoceros-201.mypinata.cloud/ipfs/" + temp_cid + '?pinataGatewayToken=';
            let isBeing_1 = "https://gateway.pinata.cloud/ipfs/" + temp_cid + "?pinataGatewayToken=DlQddJX0ZBG74RznFKeBXWq0i24fOuD8ktnJMofUAYUuBlmhKKtKs01175WVvh5N";
            let comic = await meta.comics(temp_hash).call();
            let comicAuthor = comic[2];
            let comicDescription = comic[3];
            let id = 'Comic' + num  ;

            // 判斷漫畫網址是否存在
            imgURL.push(isBeing);
            //imgURL.push(isBeing_1);
            await Promise.all(imgURL.map(imageExists))
            .then(function(results) {
              if (results[i]) {
                //console.log(results);
                if (imgURL[i].substr(8, 7) == 'apricot'){
                  comicDatas.push({comicID: id, hash: temp_hash, cid: isBeing, title: temp_title, author: comicAuthor, description: comicDescription }); 
                }else{
                  //comicDatas.push({comicID: id, hash: temp_hash, cid: isBeing_1, title: temp_title, author: comicAuthor, description: comicDescription }); 
                }
              }
            });
            num = num + 1;
          }

          console.log(comicDatas);
          //儲存comicDatas資料至各分頁
          localStorage.setItem('comicDatas', JSON.stringify(comicDatas));
          //要刪除可以用下列的程式
          //localStorage.removeItem('web3Instance', 'contractInstance', 'comicDatas');

          //儲存purchaseData資料至各分頁
          const chapterInfo = [];
          for (var i = 1; i < comicDatas.length; i++) {
            let temp = await meta.getChapters(comicDatas[i].hash).call();
            chapterInfo.push(temp);
          }
          //console.log(chapterInfo);  //每本漫畫的所有章節
          await contractInstance.getPastEvents('ChapterPurchased', {
            fromBlock: 0,
          }, function(error, events){ })
          .then(function(events){
            //console.log(events);
            for (var i = 0; i < events.length; i++) {
              let num = 1;
              let id = 'Chapter' + num;
              for (var n = 0; n < chapterInfo.length; n++) {   //每本漫畫的所有章節
                if(chapterInfo[n][0] == events[i].returnValues.chapterHash){  //讀者購買的章節
                  let price = (events[i].returnValues.price.toString()) / 1e18;
                  purchaseData.push({
                    buyer: events[i].returnValues.buyer,
                    chapterHash: events[i].returnValues.chapterHash,
                    chapterPrice: price,
                    title:  chapterInfo[n][1][0],
                    comicID: comicDatas[n+1].comicID,
                    chapterID: id,
                    comicTitle: comicDatas[n+1].title,
                    author: comicDatas[n+1].author,
                  });
                }
              }
              num = num + 1;
            }
          })
          console.log(purchaseData);
          localStorage.setItem('purchaseData', JSON.stringify(purchaseData));
          //localStorage.removeItem('purchaseData');

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
      },{
        path: "/createWork",
        element: <CreateWork />,
      },{
        path: "/workManagement",
        element: <WorkManagement />,
      },{
        path: "/selectChapter/:comicID",
        element: <SelectChapter />,
      },{
        path: "/reader_Chapter/:comicID",
        element: <ReaderChapter />,
      },{
        path: "/reader_Chapter/:comicID/:chapterID",
        element: <Reading />,
      },{
        path: "/transactionHistory",
        element: <TransactionHistory />,
      },{
        path: "/purchaseHistory",
        element: <PurchaseHistory />,
      },{
        path: "/chapterManagement/:comicID",
        element: <ChapterManagement />,
      }
    ],
  },
]);

// 渲染應用程序
createRoot(document.getElementById("root")).render(
  <RouterProvider router={router} />
);


export {getIpfsHashFromBytes32, imageExists};
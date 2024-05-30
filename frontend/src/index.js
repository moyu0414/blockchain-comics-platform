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
import EditWork from './routes/editWork';
import WorkManagement from './routes/workManagement';
import ChapterManagement from './routes/chapterManagement';
import SelectChapter from './routes/selectChapter';
import ReaderChapter from './routes/reader_Chapter';
import Reading from './routes/reading';
import TransactionHistory from './routes/transactionHistory';
import PurchaseHistory from './routes/purchaseHistory';
import ComicManagement from './routes/comicManagement';
import AccountManagement from './routes/accountManagement';
import Web3 from 'web3';
import comicData from "./contracts/ComicPlatform_0526.json"
import { Buffer } from 'buffer';
import bs58 from 'bs58';

let comicDatas = [];
let initialData = [];
let purchaseData = [];
let creatorLogs = [];
let readerLogs = [];
let num = 1;

const AppLayout = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [web3Instance, setWeb3Instance] = useState(null);
  const [contractInstance, setContractInstance] = useState(null);
  const currentAccount = localStorage.getItem("currentAccount");

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

          // 創建合約實例，需替換為您的合約地址
          const contractInstance = new web3Instance.eth.Contract(comicData.abi, comicData.address);
          setContractInstance(contractInstance);
          //console.log(contractInstance);
          const meta = await contractInstance.methods;
          //console.log(meta);

          let allComic = await meta.getAllComicHashes().call(); // 所有最新的漫畫 Hash
          //console.log(allComic);

          let temp_title, temp_hash, temp_initialHash, temp_cid, comicAuthor, comicDescription, comicLevel, comicExists, exists;
          for (var i = 0; i < allComic[0].length; i++) {
            exists = allComic[2][i]
            if (exists == true) {
              let initialComic = await meta.editcomicHistory(allComic[0][i]).call();
              if (initialComic == allComic[0][i]) {  //漫畫hash未改變 => comics
                temp_hash = initialComic;
                temp_initialHash = temp_hash;
                let comic = await meta.comics(temp_hash).call();
                temp_title = comic[1];
                comicAuthor = comic[2].toLowerCase();
                comicDescription = comic[3];
                comicLevel = comic[4].toString();
                //comicExists = comic[5];
              } else {  //漫畫hash改變 => getcomic
                temp_hash = allComic[0][i];
                temp_initialHash = initialComic;
                let comic = await meta.getcomic(temp_hash).call();
                temp_title = comic[0];
                comicAuthor = comic[1].toLowerCase();
                comicDescription = comic[2];
                comicLevel = comic[3].toString();
                //comicExists = comic[5];  //待確認
              };
              let id = 'Comic' + num  ;
              temp_cid = getIpfsHashFromBytes32(temp_hash);
              let getURL = "https://apricot-certain-boar-955.mypinata.cloud/ipfs/" + temp_cid + "?pinataGatewayToken=DlQddJX0ZBG74RznFKeBXWq0i24fOuD8ktnJMofUAYUuBlmhKKtKs01175WVvh5N";
              let imgURL = [];
              imgURL.push(getURL);
              await Promise.all(imgURL.map(imageExists))
              .then(function(results) {
                if (results[0] == true && imgURL[0].substr(8, 7) == 'apricot') {
                  comicDatas.push({comicID: id, hash: temp_hash, cid: getURL, title: temp_title, author: comicAuthor, description: comicDescription, level: comicLevel, initialHash: temp_initialHash, exists: exists});
                }
              });
              num = num + 1;
            }
          }
          console.log("comicDatas：" , comicDatas);
          //儲存comicDatas資料至各分頁
          localStorage.setItem('comicDatas', JSON.stringify(comicDatas));
          //要刪除可以用下列的程式
          //localStorage.removeItem('web3Instance', 'contractInstance', 'comicDatas');

          //儲存purchaseData資料至各分頁
          const chapterInfo = [];
          const temp_initialChapterHash = [];
          for (var i = 0; i < comicDatas.length; i++) {
            let temp = await meta.getChapters(comicDatas[i].hash).call();
            chapterInfo.push(temp);
          }
          //console.log(chapterInfo);  //漫畫－所有章節－變更後資料
          let latestChapterHash, temp_price, initialChapterHash, isPurchasedChapter;
          for (var i = 0; i < chapterInfo.length; i++) {
            for (var n = 0; n < chapterInfo[i][0].length; n++) {
              latestChapterHash = chapterInfo[i][0][n];
              temp_title = chapterInfo[i][1][n];
              let price = chapterInfo[i][2][n];
              temp_price = parseFloat(price) / 1e18;
              initialChapterHash = await meta.editchapterHistory(comicDatas[i].initialHash, latestChapterHash).call();
              initialData.push({
                initialComic: comicDatas[i].initialHash,
                initialChapterHash: initialChapterHash,
                latestChapterHash: latestChapterHash,
                chapterTitle: temp_title
              });
            };
          };
          console.log("initialData：", initialData);

          await contractInstance.getPastEvents('ChapterPurchased', {
            fromBlock: 0,
          }, function(error, events){ })
          .then(function(events){
           //console.log(events);  //所有購買紀錄(一次性)
            for (var z = 0; z < comicDatas.length; z++) {
              let num_01 = 1;
              for (var n = 0; n < initialData.length; n++) {
                if(comicDatas[z].initialHash == initialData[n].initialComic){
                  let id = 'Chapter' + num_01;
                  for (var i = 0; i < events.length; i++) {
                    if(initialData[n].initialComic == events[i].returnValues.comicHash && initialData[n].initialChapterHash == events[i].returnValues.chapterHash){  //讀者購買的章節
                      let price = (events[i].returnValues.price.toString()) / 1e18;
                      purchaseData.push({
                        buyer: events[i].returnValues.buyer.toLowerCase(),  //轉成小寫
                        chapterHash: events[i].returnValues.chapterHash,  //最初的章節hash
                        latestChapterHash: initialData[n].latestChapterHash,  //最新的章節hash
                        chapterPrice: price,
                        title:  initialData[n].chapterTitle,
                        comicID: comicDatas[z].comicID,
                        chapterID: id,
                        comicTitle: comicDatas[z].title,
                        author: comicDatas[z].author,
                        transactionHash: events[i].transactionHash
                      });
                    }
                  }
                  num_01 = num_01 + 1;
                }
              }
            }
          })
          console.log("purchaseData：" , purchaseData);
          localStorage.setItem('purchaseData', JSON.stringify(purchaseData));
          //localStorage.removeItem('purchaseData');   // 刪除purchaseData的localStorage

          //儲存logsData資料至各分頁
          let transactionHash, comicTitle, chapterTitle, price, TxnFee, date, time= '';
          for (var i = 0; i < purchaseData.length; i++) {
            const currentPurchase = purchaseData[i];
            if (currentAccount === currentPurchase.author) {  //作者logs
              transactionHash = currentPurchase.transactionHash;
              comicTitle = currentPurchase.comicTitle;
              chapterTitle = currentPurchase.title;
              price = currentPurchase.chapterPrice;
            } else if (currentAccount === currentPurchase.buyer){   //讀者logs
              transactionHash = currentPurchase.transactionHash;
              comicTitle = currentPurchase.comicTitle;
              chapterTitle = currentPurchase.title;
              price = currentPurchase.chapterPrice;
            } else {
              continue;
            }
            if (transactionHash != '') {
              const transactionDetail = await web3Instance.eth.getTransaction(transactionHash);
              const blockNumberDetail = await web3Instance.eth.getBlock(transactionDetail.blockNumber.toString());
              const blockNumber = transactionDetail.blockNumber.toString();
              const gas = transactionDetail.gas.toString();
              const gasPrice = transactionDetail.gasPrice.toString();
              TxnFee = web3Instance.utils.fromWei(gas * gasPrice, 'ether');
              TxnFee = parseFloat(TxnFee).toFixed(5);
              const timestamp = blockNumberDetail.timestamp;
              date = formatDate(new Date(Number(timestamp) * 1000));
              time = formatTime(new Date(Number(timestamp) * 1000));
            }
            if (currentAccount === currentPurchase.author) {  //作者logs
              creatorLogs.push({
                comicTitles: comicTitle,
                chapterTitles: chapterTitle,
                reader: currentPurchase.buyer,
                date: date,
                time: time,
                price: price,
              });
            } else if (currentAccount === currentPurchase.buyer){   //讀者logs
              readerLogs.push({
                comicTitles: comicTitle,
                chapterTitles: chapterTitle,
                author: currentPurchase.author,
                date: date,
                time: time,
                price: price,
                TxnFee: TxnFee
              });
            }
          }
          console.log(creatorLogs);
          console.log(readerLogs);
          localStorage.setItem('creatorLogs', JSON.stringify(creatorLogs));
          localStorage.setItem('readerLogs', JSON.stringify(readerLogs));

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

//日期轉換格式 yyyy/mm/dd
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
};

//日期轉換格式 hh：mm：ss
function formatTime(date) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
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
        path: "/editWork",
        element: <EditWork />,
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
        path: "/reading/:comicID/:chapterID",
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
      },{
        path: "/comicManagement",
        element: <ComicManagement contractAddress={comicData.address} />,
      },{
        path: "/accountManagement",
        element: <AccountManagement />,
      }
    ],
  },
]);

// 渲染應用程序
createRoot(document.getElementById("root")).render(
  <RouterProvider router={router} />
);


export {getIpfsHashFromBytes32, imageExists, formatDate, formatTime};
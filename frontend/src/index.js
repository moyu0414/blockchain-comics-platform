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
import comicData from "./contracts/ComicPlatform.json"
import { Buffer } from 'buffer';
import bs58 from 'bs58';
import axios from 'axios';

let DBComicDatas = [];
let DBChapterDatas = [];
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
      await axios.get('http://localhost:5000/api/comics')
      .then(response => {
        console.log("DB comicData：" , response.data);
        DBComicDatas = response.data;
        localStorage.setItem('DB_ComicDatas', JSON.stringify(response.data));
      })
      .catch(error => {
        console.error('Error fetching comics: ', error);
      });

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

          sortByTimestamp(DBComicDatas);
          let comicHash, id, temp_title, temp_hash, comicAuthor, comicDescription, comicCategory, comicExists, exists, filename;
          for (var i = 0; i < DBComicDatas.length; i++) {
            let id = 'Comic' + (i + 1) ;
            if (DBComicDatas[i].is_exist == 1) {
              comicHash = DBComicDatas[i].comic_id;
              temp_title = DBComicDatas[i].title;
              comicAuthor = DBComicDatas[i].creator;
              comicDescription = DBComicDatas[i].description;
              comicCategory = DBComicDatas[i].category;
              exists = DBComicDatas[i].is_exist;
              filename = DBComicDatas[i].filename;

              comicDatas.push({comicID: id, hash: temp_hash, title: temp_title, author: comicAuthor, description: comicDescription, category: comicCategory, exists: exists, filename: filename, comicHash: comicHash});
            }
          }
          console.log("comicDatas：" , comicDatas);
          //儲存comicDatas資料至各分頁
          localStorage.setItem('comicDatas', JSON.stringify(comicDatas));
          //要刪除可以用下列的程式
          //localStorage.removeItem('web3Instance', 'contractInstance', 'comicDatas');


          //儲存purchaseData資料至各分頁
          await axios.get('http://localhost:5000/api/chapters')
          .then(response => {
            //console.log("DB chapterData：" , response.data);
            DBChapterDatas = response.data;
          })
          .catch(error => {
            console.error('Error fetching comics: ', error);
          });
          //console.log(chapterInfo);  //漫畫－所有章節－變更後資料
          let latestChapterHash, temp_price, initialChapterHash, isPurchasedChapter;


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

// 排序函数，根据时间戳部分进行比较
function sortByTimestamp(Array) {
  return Array.sort((a, b) => {
    const timestampA = parseInt(a.filename.split('-')[0]);
    const timestampB = parseInt(b.filename.split('-')[0]);
    return timestampA - timestampB;  // 升序排序
  });
}


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


export {getIpfsHashFromBytes32, imageExists, formatDate, formatTime, sortByTimestamp};
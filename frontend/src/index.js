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
let DBPurchasedDatas = [];
let comicDatas = [];
let initialData = [];
let purchaseData = [];
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
        //console.log("DB comicData：" , response.data);
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
          const meta = await contractInstance.methods;

          sortByTimestamp(DBComicDatas);
          let comicHash, id, temp_title, comicAuthor, comicDescription, comicCategory, comicExists, filename;
          for (var i = 0; i < DBComicDatas.length; i++) {
            let id = 'Comic' + (i + 1) ;
            if (DBComicDatas[i].is_exist == 1) {
              comicHash = DBComicDatas[i].comic_id;
              temp_title = DBComicDatas[i].title;
              comicAuthor = DBComicDatas[i].creator;
              comicDescription = DBComicDatas[i].description;
              comicCategory = DBComicDatas[i].category;
              comicExists = DBComicDatas[i].is_exist;
              filename = DBComicDatas[i].filename;

              comicDatas.push({comicID: id, title: temp_title, author: comicAuthor, description: comicDescription, category: comicCategory, exists: comicExists, filename: filename, comicHash: comicHash});
            }
          }
          console.log("comicDatas：" , comicDatas);
          //儲存comicDatas資料至各分頁
          localStorage.setItem('comicDatas', JSON.stringify(comicDatas));
          //要刪除可以用下列的程式
          //localStorage.removeItem('web3Instance', 'contractInstance', 'comicDatas');

          await axios.get('http://localhost:5000/api/chapters')
          .then(response => {
            //console.log("DB Chapter Data：" , response.data);
            DBChapterDatas = response.data;
          })
          .catch(error => {
            console.error('Error fetching comics: ', error);
          });
          sortByTimestamp(DBChapterDatas);

          // 此帳戶的 purchaseData 儲存至各分頁
          try {
            const response = await axios.get('http://localhost:5000/api/reader/records', {
              params: { currentAccount }
            });
            //console.log('DB Purchased Data:', response.data);
            DBPurchasedDatas = response.data;
          } catch (error) {
            console.error('Error fetching reader records:', error);
          }

          for (var z = 0; z < comicDatas.length; z++) {
            let num_01 = 1;
            for (var n = 0; n < DBChapterDatas.length; n++) {
              if(comicDatas[z].comicHash == DBChapterDatas[n].comic_id){
                let id = 'Chapter' + num_01;
                for (var i = 0; i < DBPurchasedDatas.length; i++) {
                  if(DBChapterDatas[n].comic_id == DBPurchasedDatas[i].comic_id && DBChapterDatas[n].chapter_id == DBPurchasedDatas[i].chapter_id){  //讀者購買的章節
                    let date = formatDate(new Date(DBPurchasedDatas[i].purchase_date));
                    let time = formatTime(new Date(DBPurchasedDatas[i].purchase_date));
                    purchaseData.push({
                      buyer: DBPurchasedDatas[i].address,
                      chapterHash: DBPurchasedDatas[i].chapter_id,
                      chapterPrice: DBPurchasedDatas[i].price,
                      title:  DBChapterDatas[n].title,
                      filename: DBChapterDatas[n].filename,
                      comicID: comicDatas[z].comicID,
                      chapterID: id,
                      comicTitle: comicDatas[z].title,
                      author: comicDatas[z].author,
                      transactionHash: DBPurchasedDatas[i].hash,
                      date: date,
                      time: time,
                    });
                  }
                }
                num_01 = num_01 + 1;
              }
            }
          }
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
          console.log(readerLogs);

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
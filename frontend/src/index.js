import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
} from "react-router-dom";
import Home from './routes/Home';
import HomePage from './routes/homePage';
import Navbar from "./components/Navbar";
import Navigation from "./components/navigation";
import Category from './routes/category';
import ComicDetail from './routes/comicDetail';
import ManageComic from './routes/manageComic';
import Reader from './routes/reader';
import Creator from './routes/creator';
import CreatorPage from './routes/creatorPage';
import CreatorNft from './routes/creatorNft';
import Bookcase from './routes/bookcase';
import Analysis from './routes/analysis';
import Dual from './routes/dual';
import CreateWork from './routes/createWork';
import EditWork from './routes/editWork';
import EditChapter from './routes/editChapter';
import DeleteChapter from './routes/deleteChapter';
import WorkManagement from './routes/workManagement';
import ChapterManagement from './routes/chapterManagement';
import SelectChapter from './routes/selectChapter';
import ReaderChapter from './routes/reader_Chapter';
import Reading from './routes/reading';
import TransactionHistory from './routes/transactionHistory';
import PurchaseHistory from './routes/purchaseHistory';
import ComicManagement from './routes/comicManagement';
import AccountManagement from './routes/accountManagement';
import MintNFT from './routes/mintNFT';
import NftMarket from './routes/nftMarket';
import NftDetail from './routes/nftDetail';
import Web3 from 'web3';
import comicData from "./contracts/ComicPlatform.json"
import axios from 'axios';

let DBComicDatas = [];
let DBChapterDatas = [];
let comicDatas = [];

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
          let comicHash, id, temp_title, comicAuthor, comicDescription, comicCategory, comicExists, filename, protoFilename, timestamp;
          for (var i = 0; i < DBComicDatas.length; i++) {
            let id = 'Comic' + (i + 1) ;
            comicHash = DBComicDatas[i].comic_id;
            temp_title = DBComicDatas[i].title;
            comicAuthor = DBComicDatas[i].creator;
            comicDescription = DBComicDatas[i].description;
            comicCategory = DBComicDatas[i].category;
            comicExists = DBComicDatas[i].is_exist;
            filename = DBComicDatas[i].filename;
            protoFilename = DBComicDatas[i].protoFilename;
            timestamp = DBComicDatas[i].create_timestamp

            comicDatas.push({comicID: id, title: temp_title, author: comicAuthor, description: comicDescription, category: comicCategory, exists: comicExists, filename: filename, comicHash: comicHash, protoFilename: protoFilename, timestamp: timestamp});
          }
          console.log("comicDatas：" , comicDatas);
          //儲存comicDatas資料至各分頁
          localStorage.setItem('comicDatas', JSON.stringify(comicDatas));
          //要刪除可以用下列的程式
          //localStorage.removeItem('web3Instance', 'contractInstance', 'comicDatas');

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
      {isLoggedIn && <Navigation accounts={accounts} setAccounts={setAccounts}/>}
      <Outlet />
    </>
  );
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


function sortByDatetime(array) {
  return array.sort((a, b) => {
    const datetimeA = new Date(a.purchase_date);
    const datetimeB = new Date(b.purchase_date);
    return datetimeA - datetimeB;  // 升序排序
  });
}


function sortByTimestamp(array) {
  return array.sort((a, b) => {
    const timestampA = parseInt(a.create_timestamp);
    const timestampB = parseInt(b.create_timestamp);
    return timestampA - timestampB; // 升序排序
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
      },{
        path: "/homePage",
        element: <HomePage contractAddress={comicData.address} />,
      },{
        path: "/category",
        element: <Category />,
      },{
        path: "/comicDetail/:comicID",
        element: <ComicDetail />,
      },{
        path: "/creatorPage",
        element: <CreatorPage />,
      },{
        path: "/analysis",
        element: <Analysis />,
      },{
        path: "/creatorNft",
        element: <CreatorNft />,
      },{
        path: "/mintNFT",
        element: <MintNFT />,
      },{
        path: "/manageComic",
        element: <ManageComic />,
      },{
        path: "/bookcase",
        element: <Bookcase />,
      },{
        path: "/editChapter/:comicID",
        element: <EditChapter />,
      },{
        path: "/deleteChapter/:comicID",
        element: <DeleteChapter />,
      },{
        path: "/nftMarket",
        element: <NftMarket />,
      },{
        path: "/nftDetail",
        element: <NftDetail />,
      }
    ],
  },
]);

// 渲染應用程序
createRoot(document.getElementById("root")).render(
  <RouterProvider router={router} />
);


export {formatDate, formatTime, sortByTimestamp, sortByDatetime};
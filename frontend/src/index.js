import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider
} from "react-router-dom";
import Home from './routes/Home';
import HomePage from './routes/homePage';
import Navbar from "./components/Navbar";
import Navigation from "./components/navigation";
import BottomNavbar from "./components/bottomNavbar";
import Category from './routes/category';
import ComicDetail from './routes/comicDetail';
import ComicRead from './routes/comicRead';
import ManageComic from './routes/manageComic';
import Reader from './routes/reader';
import Creator from './routes/creator';
import CreatorPage from './routes/creatorPage';
import CollectionPage from './routes/collectionPage';
import CollectionNft from './routes/collectionNft';
import CreatorNft from './routes/creatorNft';
import CreateSuccess from './routes/createSuccess';
import ReaderPage from './routes/readerPage';
import Bookcase from './routes/bookcase';
import BecomeWriter from './routes/becomeWriter';
import Analysis from './routes/analysis';
import Dual from './routes/dual';
import CreateWork from './routes/createWork';
import EditWork from './routes/editWork';
import EditChapter from './routes/editChapter';
import EditSuccess from './routes/editSuccess';
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
import MessagePage from './routes/messagePage';
import VerifyPage from './routes/verifyPage';
import SearchPage from './routes/searchPage';
import VerifySuccess from './routes/verifySuccess';
import NftMarket from './routes/nftMarket';
import NftDetail from './routes/nftDetail';
import Web3 from 'web3';
import axios from 'axios';
const website = process.env.REACT_APP_Website;
const API_KEY = process.env.REACT_APP_API_KEY;


const AppLayout = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const location = useLocation();
  const isComicReadPage = location.pathname.startsWith('/comicRead/');
  const isSearchPage = location.pathname.startsWith('/searchPage');
  const headers = {'api-key': API_KEY};
  // 處理登錄狀態的函數
  const handleLogin = () => {
    setIsLoggedIn(true);
    // 其他處理邏輯，例如登錄成功後的操作
  };


  useEffect(() => {
    const initialData = async () => {
      console.log(API_KEY);
      await axios.get(`${website}/api/comics`, { headers })
      .then(response => {
        let comicDatas = response.data;
        console.log("comicDatas：" , comicDatas);
        //儲存comicDatas資料至各分頁
        localStorage.setItem('comicDatas', JSON.stringify(comicDatas));
        //要刪除可以用下列的程式
        //localStorage.removeItem('web3Instance');
      })
      
      .catch(error => {
        console.error('Error fetching comics: ', error);
      });   
    }
      
    initialData();

    // 處理登錄狀態
    handleLogin();
  }, []);

  return (
    <>
      {isLoggedIn && !isSearchPage && !isComicReadPage && <Navigation accounts={accounts} setAccounts={setAccounts}/>}
      <Outlet />
      {isLoggedIn && !isSearchPage && !isComicReadPage && <BottomNavbar />}
    </>
  );
};

// const Root = () => (
//   <Router>
//     <Routes>
//       <Route path="/" element={<AppLayout />}>
//         {/* 定義其他路由 */}
//         <Route path="/comicRead" element={<ComicRead />} />
//         {/* 其他頁面路由 */}
//       </Route>
//     </Routes>
//   </Router>
// );

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
    return datetimeB - datetimeA ;  // 降序排序
  });
}


function sortByTimestamp(array) {
  return array.sort((a, b) => {
    const timestampA = parseInt(a.create_timestamp);
    const timestampB = parseInt(b.create_timestamp);
    return timestampA - timestampB; // 升序排序
  });
}


async function getTransactionTimestamp(transactionHash) {
  try {
      const web3 = new Web3(window.ethereum);
      const transaction = await web3.eth.getTransaction(transactionHash);
      const block = await web3.eth.getBlock(transaction.blockHash);
      const timestamp = parseInt(block.timestamp.toString()) * 1000; // 转换为毫秒
      const date = new Date(timestamp);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      return formattedDate;
  } catch (error) {
      console.error('获取交易时间失败:', error);
      throw error;
  }
}


const disableAllButtons = () => {
  const buttons = document.querySelectorAll(".btn");
  buttons.forEach(button => {
    button.disabled = true;
    button.style.backgroundColor = "grey";
    button.style.opacity = 0.3;
  });
};


const enableAllButtons = () => {
  const buttons = document.querySelectorAll(".btn");
  buttons.forEach(button => {
    button.disabled = false;
    button.style.backgroundColor = "#F6B93B";
    button.style.opacity = 1;
  });
};

const detectEthereumProvider = () => {
  if (window.ethereum) {
      return window.ethereum;
  } else if (window.web3) {
      return window.web3.currentProvider;
  } else {
      console.log("偵測到非以太坊瀏覽器。請安裝 MetaMask 或其他支援的錢包");
      alert("偵測到非以太坊瀏覽器。請安裝 MetaMask 或其他支援的錢包");
      return null;
  }
};

const initializeWeb3 = async () => {
  const provider = detectEthereumProvider();
  if (provider) {
      const web3 = new Web3(provider);
      return web3;
  }
  return null;
};


const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      {
        path: "/",
        element: <Home />,
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
        element: <ComicManagement />,
      },{
        path: "/accountManagement",
        element: <AccountManagement />,
      },{
        path: "/homePage",
        element: <HomePage />,
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
        path: "/nftDetail/:tokenId",
        element: <NftDetail />,
      },{
        path: "/readerPage",
        element: <ReaderPage />,
      },{
        path: "/comicRead/:comicID/:chapterID",
        element: <ComicRead />,
      },{
        path: "/collectionPage",
        element: <CollectionPage />,
      },{
        path: "/messagePage",
        element: <MessagePage />,
      },{
        path: "/collectionNft",
        element: <CollectionNft />,
      },{
        path: "/becomeWriter",
        element: <BecomeWriter />,
      },{
        path: "/verifyPage",
        element: <VerifyPage />,
      },{
        path: "/verifySuccess",
        element: <VerifySuccess />,
      },{
        path: "/searchPage",
        element: <SearchPage />,
      },{
        path: "/createSuccess",
        element: <CreateSuccess />,
      },{
        path: "/editSuccess",
        element: <EditSuccess />,
      }
    ],
  },
]);

// 渲染應用程序
createRoot(document.getElementById("root")).render(
  <RouterProvider router={router} />
);

export { formatDate, formatTime, sortByTimestamp, sortByDatetime, getTransactionTimestamp, disableAllButtons, enableAllButtons, detectEthereumProvider, initializeWeb3 };
import React, { useState, useEffect } from "react";
import Web3 from 'web3';
import comicData from "../contracts/ComicPlatform.json";
import {formatDate, formatTime} from '../index';

const TransactionHistory = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initContract = async () => {
      try {
        const web3Instance = new Web3(window.ethereum);
        const contractInstance = new web3Instance.eth.Contract(comicData.abi, comicData.address);
        const account = await web3Instance.eth.getAccounts();
  
        const chapterArrayJSON = localStorage.getItem('purchaseData');
        const chapterArray = JSON.parse(chapterArrayJSON);
        console.log(chapterArray);

        const temp_logs = [];
        let totalPrice = 0;
        for (var i = 0; i < chapterArray.length; i++) {
          if (account[0] === chapterArray[i].author) {
            const transactionHash = chapterArray[i].transactionHash;
            const comicTitle = chapterArray[i].comicTitle;
            const chapterTitle = chapterArray[i].title;
            const price = chapterArray[i].chapterPrice;
            
            const transactionDetail = await web3Instance.eth.getTransaction(transactionHash);
            const blockNumberDetail = await web3Instance.eth.getBlock(transactionDetail.blockNumber.toString());
            const blockNumber = transactionDetail.blockNumber.toString();
            const timestamp = blockNumberDetail.timestamp;
            const date = formatDate(new Date(Number(timestamp) * 1000));
            const time = formatTime(new Date(Number(timestamp) * 1000));
            totalPrice = totalPrice + price;
            temp_logs.push({
              comicTitles: comicTitle,
              chapterTitles: chapterTitle,
              reader: chapterArray[i].buyer,
              date: date,
              time: time,
              price: price,
              total: totalPrice
            });
          }
        }
        console.log(temp_logs);
        setLogs(temp_logs);
        setLoading(false);
      } catch (error) {
        console.error('Error initializing contract:', error);
      }
    };
  
    initContract();
  }, []);  


  return (
    <div className='history-page'>
      <h2>創作者_交易紀錄</h2>
      {loading &&  
        <div className="loading-container">
          <div>交易紀錄加載中，請稍後...</div>
        </div>
      }
      <div className="chapter-selection">
        <table className="table table-image">
          <thead>
            <tr>
              <th>漫畫</th>
              <th>章節</th>
              <th>讀者</th>
              <th>交易時間</th>
              <th>交易金額</th>
              <th>累計金額</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, index) => (
              <tr key={index}>
                <td>{log.comicTitles}</td>
                <td>{log.chapterTitles}</td>
                <td>{log.reader}</td>
                <td>{log.date}<br />{log.time}</td>
                <td>{log.price}</td>
                <td>{log.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionHistory;

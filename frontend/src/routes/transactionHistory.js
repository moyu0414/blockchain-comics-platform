import React, { useState, useEffect } from "react";
import Web3 from 'web3';
import comicData from "../contracts/ComicPlatform.json";
import {formatDate, formatTime} from '../index';

const TransactionHistory = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentAccount = localStorage.getItem("currentAccount");

  useEffect(() => {
    const initContract = async () => {
      try {
        const creatorLogs = localStorage.getItem("creatorLogs");
        const chapterLogArray = JSON.parse(creatorLogs);
        console.log(chapterLogArray);

        chapterLogArray.sort(compare);  //依照時間做排序
        let totalPrice = 0;
        const updatedData = chapterLogArray.map(item => {
          totalPrice += item.price; // 累加价格
          const formattedTotalPrice = Number(totalPrice.toFixed(4));
          return {...item, totalprice: formattedTotalPrice};
        });
        console.log(updatedData);    
        setLogs(updatedData);
        setLoading(false);
      } catch (error) {
        console.error('Error initializing contract:', error);
      }
    };
  
    initContract();
  }, []);

  // 按照时间排序
  function compare(a, b) {
    const datetimeA = new Date(a.date + ' ' + a.time);
    const datetimeB = new Date(b.date + ' ' + b.time);
    return datetimeA - datetimeB;
  }


  return (
    <div className='history-page'>
      <h2 className="title-text">創作者_交易紀錄</h2>
      {loading &&  
        <div className="loading-container">
          <div>交易紀錄加載中，請稍後...</div>
        </div>
      }
      <div className="history-container">
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
                <td>{log.totalprice}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionHistory;

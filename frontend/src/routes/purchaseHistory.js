import React, { useState, useEffect } from "react";
import Web3 from 'web3';
import {formatDate, formatTime} from '../index';

const PurchaseHistory = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [being, setBeing] = useState(false);
  const currentAccount = localStorage.getItem("currentAccount");
  
  useEffect(() => {
    const initContract = async () => {
      try {
        const readerLogs = localStorage.getItem("readerLogs");
        const readerLogArray = JSON.parse(readerLogs);
        console.log(readerLogArray);
        
        readerLogArray.sort(compare);  //依照時間做排序
        console.log(readerLogArray);
        setLogs(readerLogArray);
        setLoading(false);
        if (readerLogArray.length < 1){
          setBeing(true);
        };
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
      <h2 className="title-text">讀者_購買紀錄</h2>
      {loading &&  
        <div className="loading-container">
          <div>交易紀錄加載中，請稍後...</div>
        </div>
      }
      {being &&  
        <div className="loading-container">
          <div>目前無購買漫畫，請重新刷新...</div>
        </div>
      }
      <div className="history-container">
        <table className="table table-image">
          <thead>
            <tr>
              <th>漫畫</th>
              <th>章節</th>
              <th>作者</th>
              <th>交易時間</th>
              <th>交易金額</th>
              <th>手續費</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, index) => (
              <tr key={index}>
                <td>{log.comicTitles}</td>
                <td>{log.chapterTitles}</td>
                <td>{log.author}</td>
                <td>{log.date}<br />{log.time}</td>
                <td>{log.price}</td>
                <td>{log.TxnFee}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PurchaseHistory;

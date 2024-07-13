import React, { useState, useEffect } from "react";
import axios from 'axios';
import { formatDate, formatTime, sortByDatetime } from '../index.js';

const PurchaseHistory = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [being, setBeing] = useState(false);
  const currentAccount = localStorage.getItem("currentAccount");
  let readerLogs = [];
  let readerLogArray = [];

  useEffect(() => {
    const initContract = async () => {
      try {
        try {
          const response = await axios.get('http://localhost:5000/api/purchaseHistory/records', {
            params: {
              currentAccount: currentAccount
            }
          });
          readerLogs = response.data;
        } catch (error) {
          console.error('Error fetching reader records:', error);
        }
        sortByDatetime(readerLogs);
        //console.log(readerLogs);

        for (var n = 0; n < readerLogs.length; n++) {
          let date = formatDate(new Date(readerLogs[n].purchase_date));
          let time = formatTime(new Date(readerLogs[n].purchase_date));
          let chapterPrice = readerLogs[n].price;
          readerLogArray.push({
            comicTitle: readerLogs[n].comicTitle,
            chapterTitle: readerLogs[n].chapterTitle,
            creator: readerLogs[n].creator,
            date: date,
            time: time,
            chapterPrice: readerLogs[n].recordsPrice,
          });
        };
        //console.log(readerLogArray);

        let totalPrice = 0;
        const updatedData = readerLogArray.map(item => {
          totalPrice += parseFloat(item.chapterPrice); // 累加价格
          const formattedTotalPrice = Number(totalPrice.toFixed(4));
          return {...item, totalprice: formattedTotalPrice};
        });
        console.log(updatedData);
        setLogs(updatedData);
        setLoading(false);
        if (updatedData.length < 1){
          setBeing(true);
        };
      } catch (error) {
        console.error('Error initializing contract:', error);
      }
    };
    initContract();
  }, []);
    
  
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
              <th>累計金額</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, index) => (
              <tr key={index}>
                <td>{log.comicTitle}</td>
                <td>{log.chapterTitle}</td>
                <td>{log.creator}</td>
                <td>{log.date}<br />{log.time}</td>
                <td>{log.chapterPrice}</td>
                <td>{log.totalprice}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PurchaseHistory;

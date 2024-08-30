import { useState, useEffect } from "react";
import axios from 'axios';
import { formatDate, formatTime, sortByDatetime } from '../index.js';

const TransactionHistory = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [being, setBeing] = useState(false);
  const currentAccount = localStorage.getItem("currentAccount");
  let creatorLogs = [];
  let creatorLogArray = [];

  useEffect(() => {
    const initContract = async () => {
      try {
        try {
          const response = await axios.get('https://web3toonapi.ddns.net/api/creator/records', {
            params: {
              currentAccount: currentAccount
            }
          });
          creatorLogs = response.data;
        } catch (error) {
          console.error('Error fetching reader records:', error);
        }
        sortByDatetime(creatorLogs);
        //console.log(creatorLogs);


        for (var n = 0; n < creatorLogs.length; n++) {
          let date = formatDate(new Date(creatorLogs[n].purchase_date));
          let time = formatTime(new Date(creatorLogs[n].purchase_date));
          let chapterPrice = creatorLogs[n].price;
          let income = (chapterPrice * 0.9).toFixed(3);  // 四捨五入取到小數點第3位
          creatorLogArray.push({
            comicTitle: creatorLogs[n].comicTitle,
            chapterTitle: creatorLogs[n].chapterTitle,
            date: date,
            time: time,
            chapterPrice: creatorLogs[n].price,
            income: income
          });
        };
        //console.log(creatorLogArray);


        let totalPrice = 0;
        const updatedData = creatorLogArray.map(item => {
          totalPrice += parseFloat(item.income); // 累加价格
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
      <h2 className="title-text">創作者_交易紀錄</h2>
      {loading &&  
        <div className="loading-container">
          <div>交易紀錄加載中，請稍後...</div>
        </div>
      }
      {being &&  
        <div className="loading-container">
          <div>目前沒有讀者購買漫畫，請重新刷新...</div>
        </div>
      }
      <div className="history-container">
        <table className="table table-image">
          <thead>
            <tr>
              <th>漫畫</th>
              <th>章節</th>
              <th>交易時間</th>
              <th>交易金額</th>
              <th>實收金額</th>
              <th>累計實收金額</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, index) => (
              <tr key={index}>
                <td>{log.comicTitle}</td>
                <td>{log.chapterTitle}</td>
                <td>{log.date}<br />{log.time}</td>
                <td>{log.chapterPrice}</td>
                <td>{log.income}</td>
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

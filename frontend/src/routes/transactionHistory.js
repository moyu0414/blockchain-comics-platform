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
        for (var i = 0; i < chapterArray.length; i++) {
          if (account[0] === chapterArray[i].author) {
            //console.log(chapterArray[i]);

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
            temp_logs.push({
              comicTitles: comicTitle,
              chapterTitles: chapterTitle,
              reader: chapterArray[i].buyer,
              date: date,
              time: time,
              price: price,
            });
          }
        }
        temp_logs.sort(compare);  //依照時間做排序
        let totalPrice = 0;
        const updatedData = temp_logs.map(item => {
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

import React, { useState, useEffect } from "react";
import Web3 from 'web3';
import comicData from "../contracts/ComicPlatform.json";

const PurchaseHistory = () => {
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
  
        const temp_logs = [];
        for (var i = 0; i < chapterArray.length; i++) {
          if (account[0] === chapterArray[i].buyer) {
            const transactionHash = chapterArray[i].transactionHash;
            const comicTitle = chapterArray[i].comicTitle;
            const chapterTitle = chapterArray[i].title;
            const price = chapterArray[i].chapterPrice;
            
            const TransactionDetail = await web3Instance.eth.getTransaction(transactionHash);
            const blockNumberDetail = await web3Instance.eth.getBlock(TransactionDetail.blockNumber.toString());
  
            const blockNumber = TransactionDetail.blockNumber.toString();
            const gas = TransactionDetail.gas.toString();
            const gasPrice = TransactionDetail.gasPrice.toString();
            let TxnFee = web3Instance.utils.fromWei(gas * gasPrice, 'ether');
            TxnFee = parseFloat(TxnFee).toFixed(5);
  
            const timestamp = blockNumberDetail.timestamp;
            const formattedDate = formatDateWithTime(new Date(Number(timestamp) * 1000));
  
            temp_logs.push({
              comicTitles: comicTitle,
              chapterTitles: chapterTitle,
              timestamp: formattedDate,
              price: price,
              TxnFee: TxnFee
            });
          }
        }
        
        setLogs(temp_logs);
        setLoading(false);
      } catch (error) {
        console.error('Error initializing contract:', error);
      }
    };
  
    initContract();
  }, []);
  
  //日期轉換格式 yyyy/mm/dd 、 hh：mm：ss
  function formatDateWithTime(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}/${month}/${day}\n${hours}:${minutes}:${seconds}`;
  };
  
  return (
    <div className='history-page'>
      <h2>讀者_購買紀錄</h2>
      {loading &&  
        <div className="loading-container">
          <div>交易紀錄加載中，請稍後...</div>
        </div>
      }
      <div className="history-selection">
        <table className="table table-image">
          <thead>
            <tr>
              <th>交易項目</th>
              <th>交易時間</th>
              <th>交易金額</th>
              <th>手續費</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, index) => (
              <tr key={index}>
                <td>{log.comicTitles}</td>
                <td>{log.timestamp}</td>
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

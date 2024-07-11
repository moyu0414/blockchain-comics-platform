import React, { useState, useEffect } from "react";

const PurchaseHistory = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [being, setBeing] = useState(false);
  const currentAccount = localStorage.getItem("currentAccount");
  
  useEffect(() => {
    const initContract = async () => {
      try {
        const readerLogs = localStorage.getItem("purchaseData");
        const readerLogArray = JSON.parse(readerLogs);
        console.log(readerLogArray);
        
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
                <td>{log.title}</td>
                <td>{log.author}</td>
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

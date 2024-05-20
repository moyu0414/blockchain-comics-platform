import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { useParams } from 'react-router-dom';
import comicData from '../contracts/ComicPlatform.json';
import Web3 from 'web3';
import {formatDate, formatTime} from '../index';

const ReaderChapter = () => {
  const [web3Instance, setWeb3Instance] = useState('');
  const { comicID } = useParams();
  const [meta, setMeta] = useState('');
  const [message, updateMessage] = useState('');
  const [comic, setComic] = useState([]);
  const [purchase, isPurchase] = useState([]);
  const [loading, setLoading] = useState(true);
  let temp = [];
  let temp_purchase = [];


  const fetchChapters = async () => {
    try {
      const storedArrayJSON = localStorage.getItem('comicDatas');
      const storedArray = JSON.parse(storedArrayJSON);
      
      for (var i = 0; i < storedArray.length; i++) {
        if(storedArray[i].comicID == comicID){
          temp.push(storedArray[i]);
        };
      };
      console.log(temp);
      setComic(temp);

      const web3Instance = new Web3(window.ethereum);
      setWeb3Instance(web3Instance);
      const contractInstance = new web3Instance.eth.Contract(comicData.abi, comicData.address);
      const accounts = await web3Instance.eth.getAccounts();
      let meta = await contractInstance.methods;
      setMeta(meta);

      const chapterArrayJSON = localStorage.getItem('purchaseData');
      const chapterArray = JSON.parse(chapterArrayJSON);
      console.log(chapterArray);

      for (var i = 0; i < chapterArray.length; i++) {
        if(chapterArray[i].comicID == comicID && chapterArray[i].buyer == accounts[0]){
          const transactionHash = chapterArray[i].transactionHash;
          const transactionDetail = await web3Instance.eth.getTransaction(transactionHash);
          const blockNumberDetail = await web3Instance.eth.getBlock(transactionDetail.blockNumber.toString());
          const timestamp = blockNumberDetail.timestamp;
          const date = formatDate(new Date(Number(timestamp) * 1000));
          const time = formatTime(new Date(Number(timestamp) * 1000));
          temp_purchase.push({
            chapterID: chapterArray[i].chapterID,
            title: chapterArray[i].title,
            price: chapterArray[i].chapterPrice,
            date: date,
            time: time
          });
        };
      };
      temp_purchase.sort(compare);  //依照時間做排序
      console.log(temp_purchase);
      isPurchase(temp_purchase);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching chapters:', error);
    }
  };

  useEffect(() => {
    fetchChapters();
  }, []);

  // 按照时间排序
  function compare(a, b) {
    const datetimeA = new Date(a.date + ' ' + a.time);
    const datetimeB = new Date(b.date + ' ' + b.time);
    return datetimeA - datetimeB;
  }

  return (
    <div className="select-chapter-page">
      <div className="page-content">
      {comic.map((chapter, index) => (
          <div className='comic-chapter-title' key={index}>
            <center>
              <h1>{chapter.title}</h1>
              <h2>讀者閱讀_章節選擇</h2>
            </center>
          </div>
        ))}
        {loading &&  
          <div className="loading-container">
            <div>章節加載中，請稍後...</div>
          </div>
        }
        <div className="chapter-selection">
          <table className="table table-image">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">本集標題</th>
                <th scope="col">交易金額</th>
                <th scope="col">購買時間</th>
                <th scope="col"></th>
              </tr>
            </thead>
            <tbody>
              {purchase.map((chapter, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td className='chapter-title'>{chapter.title}</td>
                  <td>{chapter.price}</td>
                  <td>{chapter.date}<br />{chapter.time}</td>
                  <td>
                    <Link to={`/reading/${comicID}/${chapter.chapterID}`}> 
                      <button className="btn" >閱讀</button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-red-500 text-center">{message}</div>
        </div>
      </div>
    </div>
  );
};

export default ReaderChapter;
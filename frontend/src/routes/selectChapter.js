import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import comicData from '../contracts/ComicPlatform.json';
import Web3 from 'web3';
import $ from 'jquery';
import axios from 'axios';
import { sortByTimestamp } from '../index';

const SelectChapter = () => {
  const [web3, setWeb3] = useState(null);
  const [web3Instance, setWeb3Instance] = useState('');
  const [chapters, setChapters] = useState([]);
  const { comicID } = useParams();
  const [comic, setComic] = useState([]);
  const [message, updateMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAuthor, setIsAuthor] = useState('');
  const [chaptersLoaded, setChaptersLoaded] = useState(false);
  const currentAccount = localStorage.getItem("currentAccount");

  let temp = [];
  let purchaseChapter = [];
  let chapterInfo = [];
  let temp_chapter = [];
  let temp_purchase = [];

  const fetchChapters = async () => {
    try {
      const web3 = new Web3(window.ethereum);
      setWeb3(web3);
      const contractInstance = new web3.eth.Contract(comicData.abi, comicData.address);
      setWeb3Instance(contractInstance);

      const storedArrayJSON = localStorage.getItem('comicDatas');
      const storedArray = JSON.parse(storedArrayJSON);
      
      for (var i = 0; i < storedArray.length; i++) {
        if(storedArray[i].comicID == comicID){
          temp.push(storedArray[i]);
        };
      };
      setComic(temp);  // 此漫畫資料
      console.log(temp);

      try {  // 這本漫畫得所有章節
        const response = await axios.get('http://localhost:5000/api/chapters', {
          params: {
            comicHash: temp[0].comicHash
          }
        });
        chapterInfo = response.data;
      } catch (error) {
        console.error('Error fetching records:', error);
      }
      sortByTimestamp(chapterInfo);
      console.log(chapterInfo);

      try {
        const response = await axios.get('http://localhost:5000/api/selectChapter/records', {
          params: {
            currentAccount: currentAccount,
            comicHash: temp[0].comicHash
          }
        });
        purchaseChapter = response.data;
      } catch (error) {
        console.error('Error fetching records:', error);
      }
      console.log(purchaseChapter);



      if(purchaseChapter.length == 0){
        purchaseChapter.push({buyer: '', chapterHash: ''});
      };
      console.log(purchaseChapter);

      let author = temp[0].author;
      let temp_isAuthor = author;
      let num = 1;
      for (var n = 0; n < chapterInfo.length; n++) {  //本漫畫所有章節
        let chapterHash = chapterInfo[n].chapterHash;
        let chapterTitle = chapterInfo[n].chapterTitle;
        let price = chapterInfo[n].price;
        let id = 'Chapter' + num;
        let temp_isBuying = '購買';

        for (var i = 0; i < purchaseChapter.length; i++) {  //讀者部分
          if(purchaseChapter[i].chapterHash == chapterHash){
            temp_isBuying = '閱讀';
          }
        };

        if(temp[0].author == currentAccount){  //作者部分
          temp_isBuying = '閱讀';
          temp_isAuthor = '您是本作品的創作者!';
        }
        temp_chapter.push({
          chapterHash: chapterHash,
          chapterID: id,
          title: chapterTitle,
          price: price,
          isBuying: temp_isBuying
        });
        num = num + 1;
        setIsAuthor(temp_isAuthor);
      };
      console.log(temp_chapter);
      setChapters(temp_chapter);
      setLoading(false);
      setChaptersLoaded(true);
    } catch (error) {
      console.error('Error fetching chapters:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchChapters();
      setButtonStatus();
    };
    fetchData();
  }, [comicID]);

  const setButtonStatus = () => {
    const buttons = document.querySelectorAll(".btn");
    if (temp_chapter.length === 1) {
      const operationValue = temp_chapter[0].isBuying;
      if (operationValue == '閱讀') {
        buttons.forEach(button => {
          button.disabled = false;
          button.style.backgroundColor = "#0FC2C0";
          button.style.opacity = 1;
        });
      } else {
        buttons.forEach(button => {
          button.disabled = true;
          button.style.backgroundColor = "grey";
          button.style.opacity = 0.3;
        });
      }
    } else {
      buttons.forEach((button, index) => {
        if (index < temp_chapter.length) {
          const operationValue = temp_chapter[index].isBuying;
          if (operationValue == '閱讀') {
            button.disabled = false;
            button.style.backgroundColor = "#0FC2C0";
            button.style.opacity = 1;
          } else {
            button.disabled = true;
            button.style.backgroundColor = "grey";
            button.style.opacity = 0.3;
          }
        }
      });
    }
  };
  
  

  // 章節購買 或 閱讀函數
  const handlePurchase = async (chapterId) => {
    const chapter = chapters[chapterId]; // 使用傳遞進來的索引值來訪問章節資料
    const operationValue = chapter.isBuying;
  
    if (operationValue === '閱讀') {
      updateMessage("正在進入章節閱讀中...請稍後。");
      window.location.href = `/reading/${comicID}/${chapter.chapterID}`;
    } else {
      try {
        disableAllButtons();
        let balance = await web3.eth.getBalance(currentAccount);
        balance = balance.toString() / 1e18;
        let price = chapter.price;
        if (balance > price) {
          const comicHash = comic[0].comicHash;
          const chapterHash = chapter.chapterHash;
          console.log(comicHash);
          console.log(chapterHash);
          console.log(price);
          price = web3.utils.toWei(price, 'ether');
          updateMessage("正在購買章節中...請稍後。");

          let gasEstimate = await web3Instance.methods.purchaseChapter(comicHash, chapterHash, price/10).estimateGas({
            from: currentAccount,
            value: price,
          });
          const transaction = await web3Instance.methods.purchaseChapter(comicHash, chapterHash, gasEstimate).send({
            from: currentAccount,
            value: price,
            gas: gasEstimate
          });
          const transactionHash = transaction.transactionHash;
          let Timestamp = await getTransactionTimestamp(transactionHash);

          const formData = new FormData();
          formData.append('hash', transactionHash);
          formData.append('comic_id', comicHash);
          formData.append('chapter_id', chapterHash);
          formData.append('buyer', currentAccount);
          formData.append('creator', isAuthor);
          formData.append('purchase_date', Timestamp);
          formData.append('price', chapter.price);
          try {
            const response = await axios.post('http://localhost:5000/api/add/records', formData, {
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            });
            alert('章節購買成功！');
            const updatedChapters = [...chapters];
            updatedChapters[chapterId].isBuying = '閱讀'; // 更新章節的購買狀態
            setChapters(updatedChapters);
          } catch (error) {
            console.error('購買紀錄添加至資料庫時發生錯誤：', error);
          }
          updateMessage("");
        } else {
          console.log('餘額不足');
          alert('餘額不足');
        }
      } catch (error) {
        console.error('章節購買時發生錯誤：', error);
        alert(error);
        window.location.reload();
        updateMessage("");
      } finally {
        enableAllButtons();
      }
    }
  };

  async function getTransactionTimestamp(transactionHash) {
    try {
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
      button.style.backgroundColor = "#0FC2C0";
      button.style.opacity = 1;
    });
  };

  return (
    <div className="select-chapter-page">
      <div className="page-content">
        {chaptersLoaded && (
          <>
            {comic.map((Comic, index) => (
              <div className='comic-chapter-title' key={index}>
                <center>
                  <h2>讀者購買_章節選擇</h2>
                  <h1>{Comic.title}</h1>
                  <h4>作者：{isAuthor}</h4>
                </center>
              </div>
            ))}
          </>
        )}
        {!chaptersLoaded && (
          <div className="loading-container">
            <div>章節加載中，請稍後...</div>
          </div>
        )}

        <div className="chapter-selection">
          <table className="table table-image">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">本集標題</th>
                <th scope="col">價格</th>
                <th scope="col"></th>
              </tr>
            </thead>
            <tbody>
              {chapters.map((chapter, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td className='chapter-title'>{chapter.title}</td>
                  <td>{chapter.price}</td>
                  <td>
                    <button onClick={() => handlePurchase(index)} className="btn" value={chapter.isBuying}>{chapter.isBuying}</button>
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

export default SelectChapter;

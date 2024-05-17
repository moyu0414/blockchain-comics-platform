import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import comicData from '../contracts/ComicPlatform.json';
import Web3 from 'web3';
import $ from 'jquery';

const SelectChapter = () => {
  const [account, setAccount] = useState('');
  const [web3Instance, setWeb3Instance] = useState('');
  const [chapters, setChapters] = useState([]);
  const { comicID } = useParams();
  const [meta, setMeta] = useState('');
  const [comic, setComic] = useState([]);
  const [purchase, isPurchase] = useState([]);
  const [message, updateMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isBuying, setIsBuying] = useState(true);
  const operationText = isBuying ? '購買' : '閱讀';
  const [isAuthor, setIsAuthor] = useState('');

  let temp = [];
  let temp_chapter = [];
  let temp_chapterHash = [];
  let read = [];

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
      setComic(temp);  //本漫畫所有漫畫資料

      const web3Instance = new Web3(window.ethereum);
      setWeb3Instance(web3Instance);
      const contractInstance = new web3Instance.eth.Contract(comicData.abi, comicData.address);
      const accounts = await web3Instance.eth.getAccounts();
      setAccount(accounts[0]);

      let meta = await contractInstance.methods;
      //console.log(meta);
      setMeta(meta);
      const chapterInfo = await meta.getChapters(temp[0].hash).call();
      console.log(chapterInfo);
      const chapterArrayJSON = localStorage.getItem('purchaseData');
      const chapterArray = JSON.parse(chapterArrayJSON);
      console.log(chapterArray);

      //本漫畫所有章節資料 
      for (var n = 0; n < chapterInfo[0].length; n++) {
        let temp_price = chapterInfo[2][n].toString();
        temp_price = temp_price / 1e18;
        temp_chapter.push({
          chapterHash: chapterInfo[0][n],
          title: chapterInfo[1][n],
          price: temp_price
        });
        temp_chapterHash.push(chapterInfo[0][n]);
      };
      console.log(temp_chapter);
      setChapters(temp_chapter); 

      //判斷 comicID 和 chapterID，並取出相應的購買紀錄，如果是本漫畫作者也可閱讀
      let author = temp[0].author;
      for (var n = 0; n < temp_chapterHash.length; n++) {
        for (var i = 0; i < chapterArray.length; i++) {
          if(chapterArray[i].comicID == comicID && chapterArray[i].buyer == accounts[0] && temp_chapterHash[n] == chapterArray[i].chapterHash){
            read.push(chapterArray[i]);
          } else if (author == accounts[0]){
            read.push(chapterArray[i]);
          }
        };
      };
      read.push({buyer: ''});
      console.log(read);
      isPurchase(read);


      // 判斷此帳戶是否是本漫畫作者、讀者是否購買
      if (accounts[0] == author) {
        setIsBuying(false);  // 閱讀
        setIsAuthor('您是本作品的創作者!');
      } else if(read[0].buyer == accounts[0]) {
        setIsBuying(false);
        setIsAuthor(author);
      } else{
        setIsAuthor(author);
      };
      setLoading(false);

    } catch (error) {
      console.error('Error fetching chapters:', error);
    }
  };

  useEffect(() => {
    fetchChapters();
  }, []);


  // 章節購買 或 閱讀函數
  const handlePurchase = async (chapterId) => {
    console.log(chapterId);
    const operationValue = document.getElementById("list-button").value;
    if (operationValue == '閱讀') {
      updateMessage("正在進入章節閱讀中...請稍後。")
      //for (var i = 0; i < purchase.length; i++) {
        window.location.href = `/reader_Chapter/${comicID}/${purchase[chapterId].chapterID}`; // 或根據路由設定導向首頁路徑
      //}
    } else{
      try {
      disableButton();
      const balance = await web3Instance.eth.getBalance(account);
      let price = chapters[chapterId].price;
      //如果餘額大於售價，即可購買
      if (balance > price){
        let comicHash = comic[chapterId].hash;
        let chapterHash = chapters[chapterId].chapterHash;
        console.log("chapterId：" + chapterId);
        console.log("comicHash：" + comicHash);
        console.log("chapterHash：" + chapterHash);
        updateMessage("正在購買章節中...請稍後。")

        const gas = await meta.purchaseChapter(comicHash, chapterHash).estimateGas({ from: account, value: web3Instance.utils.toWei(price, 'ether') });
        await meta.purchaseChapter(comicHash, chapterHash).send({ from: account, value: web3Instance.utils.toWei(price, 'ether'), gas });

        alert('章節購買成功！');
        enableButton();
        updateMessage("");
      } else{
        console.log('餘額不足');
        alert('餘額不足');
      };
      } catch (error) {
        console.error('章節購買時發生錯誤：', error);
        alert(error);
        //alert('章節購買時發生錯誤!');
        enableButton();
        updateMessage("");
      }
    }
  };


  async function disableButton() {
    const listButton = document.getElementById("list-button")
    listButton.disabled = true
    listButton.style.backgroundColor = "grey";
    listButton.style.opacity = 0.3;
  }

  async function enableButton() {
      const listButton = document.getElementById("list-button")
      listButton.disabled = false
      listButton.style.backgroundColor = "#A500FF";
      listButton.style.opacity = 1;
  }


  return (
    <div className="select-chapter-page">
      <div className="page-content">
       {comic.map((Comic, index) => (
          <div className='comic-chapter-title' key={index}>
            <center>
              <h1>{Comic.title}</h1>
              <h4>作者：{isAuthor}</h4>
              <h2>讀者購買_章節選擇</h2>
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
                    <button onClick={() => handlePurchase(index)} className="btn btn-primary" id="list-button" value={operationText}>{operationText}</button>
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
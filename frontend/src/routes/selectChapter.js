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
  const [message, updateMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAuthor, setIsAuthor] = useState('');

  let temp = [];
  let temp_chapter = [];
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
      //console.log(temp);
      setComic(temp);  //本漫畫所有漫畫資料

      const web3Instance = new Web3(window.ethereum);
      setWeb3Instance(web3Instance);
      const contractInstance = new web3Instance.eth.Contract(comicData.abi, comicData.address);
      const accounts = await web3Instance.eth.getAccounts();
      setAccount(accounts[0]);

      let meta = await contractInstance.methods;
      setMeta(meta);
      const chapterInfo = await meta.getChapters(temp[0].hash).call();
      console.log(chapterInfo);  //本漫畫所有章節
      const chapterArrayJSON = localStorage.getItem('purchaseData');
      const chapterArray = JSON.parse(chapterArrayJSON);
      //console.log(chapterArray);

      for (var i = 0; i < chapterArray.length; i++) {  //本漫畫中，章節購買者
        if(chapterArray[i].comicID == comicID){
          temp_purchase.push(chapterArray[i]);
        }
      };
      //console.log(temp_purchase);
      if(temp_purchase.length == 0){
        temp_purchase.push({buyer: '', chapterHash: ''});
      };
      console.log(temp_purchase);

      //本漫畫所有章節資料 
      let author = temp[0].author;
      let temp_isAuthor = author;
      let num = 1;
      for (var n = 0; n < chapterInfo[0].length; n++) {  //本漫畫所有章節
        let chapterHash = chapterInfo[0][n];
        let chapterTitle = chapterInfo[1][n];
        let temp_price = chapterInfo[2][n].toString();
        temp_price = temp_price / 1e18;
        let id = 'Chapter' + num;
        let temp_isBuying = '購買';
        for (var i = 0; i < temp_purchase.length; i++) {  //讀者部分
          if(temp_purchase[i].buyer == accounts[0] && chapterHash == temp_purchase[i].chapterHash){
            temp_isBuying = '閱讀';
          }
        };
        if(temp[0].author == accounts[0]){  //作者部分
          temp_isBuying = '閱讀';
          temp_isAuthor = '您是本作品的創作者!';
        }
        temp_chapter.push({
          chapterHash: chapterHash,
          chapterID: id,
          title: chapterTitle,
          price: temp_price,
          isBuying: temp_isBuying
        });
        num = num + 1;
        setIsAuthor(temp_isAuthor);
      };
      console.log(temp_chapter);
      setChapters(temp_chapter);
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
    const operationValue = chapters[chapterId].isBuying;
    if (operationValue == '閱讀') {
      updateMessage("正在進入章節閱讀中...請稍後。")
        window.location.href = `/reading/${comicID}/${chapters[chapterId].chapterID}`; // 或根據路由設定導向首頁路徑
    } else{
      try {
      disableButton();
      const balance = await web3Instance.eth.getBalance(account);
      let price = chapters[chapterId].price;
      //如果餘額大於售價，即可購買
      if (balance > price){
        let comicHash = comic[0].hash;
        let chapterHash = chapters[chapterId].chapterHash;
        console.log("chapterId：" + chapterId);
        console.log("comicHash：" + comicHash);
        console.log("chapterHash：" + chapterHash);
        updateMessage("正在購買章節中...請稍後。")

        const gas = await meta.purchaseChapter(comicHash, chapterHash).estimateGas({ from: account, value: web3Instance.utils.toWei(price, 'ether') });
        await meta.purchaseChapter(comicHash, chapterHash).send({ from: account, value: web3Instance.utils.toWei(price, 'ether'), gas });

        window.location.href = `/selectChapter/${comicID}`; // 或根據路由設定導向首頁路徑
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
                    <button onClick={() => handlePurchase(index)} className="btn btn-primary" id="list-button" value={chapter.isBuying}>{chapter.isBuying}</button>
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
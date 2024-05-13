import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import comicData from '../contracts/ComicPlatform.json';
import Web3 from 'web3';

const SelectChapter = () => {
  const [account, setAccount] = useState('');
  const [chapters, setChapters] = useState([]);
  const { comicID } = useParams();
  const [meta, setMeta] = useState('');
  const [comic, setComic] = useState([]);
  const [message, updateMessage] = useState('');
  let temp = [];
  let temp_data = [];

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
      setComic(temp);

      const web3Instance = new Web3(window.ethereum);
      const contractInstance = new web3Instance.eth.Contract(comicData.abi, comicData.address);
      const accounts = await web3Instance.eth.getAccounts();
      setAccount(accounts[0]);
      let meta = await contractInstance.methods;
      setMeta(meta);
      
      const chapterInfo = await meta.getChapters(temp[0].hash).call();
      for (var i = 0; i < chapterInfo[0].length; i++) {
        let temp_price = chapterInfo[2][i].toString();
        temp_price = temp_price / 1e18;
        temp_data.push({
          chapterHash: chapterInfo[0][i],
          title: chapterInfo[1][i],
          price: temp_price
        });
      }
      console.log(temp_data);
      setChapters(temp_data);
      
    } catch (error) {
      console.error('Error fetching chapters:', error);
    }
  };

  useEffect(() => {
    fetchChapters();
  }, []);


  // 章節購買函數
  const handlePurchase = async (chapterId) => {
    try {
    disableButton();
    let comicHash = comic[chapterId].hash;
    let chapterHash = chapters[chapterId].chapterHash
    
    console.log("chapterId：" + chapterId);
    console.log("comicHash：" + comicHash);
    console.log("chapterHash：" + chapterHash);
    updateMessage("正在購買章節中...請稍後。")

    await meta.purchaseChapter(comicHash, chapterHash, 0).send({ from: account });
    alert('章節購買成功！');
    enableButton();
    updateMessage("");
  } catch (error) {
    console.error('章節購買時發生錯誤：', error);
    alert('章節購買時發生錯誤!');
    enableButton();
    updateMessage("");
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
        <h1>章節選擇</h1>
        <div className="chapter-selection">
          <table className="table table-image">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">本集標題</th>
                <th scope="col">價格</th>
                <th scope="col">操作</th>
              </tr>
            </thead>
            <tbody>
              {chapters.map((chapter, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td className='chapter-title'>{chapter.title}</td>
                  <td>{chapter.price}</td>
                  <td>
                    <button onClick={() => handlePurchase(index)} className="btn btn-primary" id="list-button">購買</button>
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
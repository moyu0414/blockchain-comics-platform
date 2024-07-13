import React, { useState, useEffect } from 'react';
import { uploadFileToIPFS } from "../pinata";
import Web3 from 'web3';
import comicData from '../contracts/ComicPlatform.json';
import $ from 'jquery';
import bs58 from 'bs58';
import { useLocation } from 'react-router-dom';
import { getIpfsHashFromBytes32, sortByTimestamp } from '../index';
import axios from 'axios';
import CryptoJS from 'crypto-js';

const EditWork = (props) => {
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [message, updateMessage] = useState('');
  const [stepCompleted, setStepCompleted] = useState(false);
  const [showChapterForm, setShowChapterForm] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState(null);
  const [comicHash, setComicHash] = useState('');
  const [chapterHash, setChapterHash] = useState('');
  const location = useLocation();
  const [hashValue, setHashValue] = useState('');
  const [file, setFile] = useState('');
  const [chapterID, setChapterID] = useState('');
  const currentAccount = localStorage.getItem("currentAccount");
  const [comic, setComic] = useState([]);
  const [chapter, setChapter] = useState([]);
  const [newComic, setNewComic] = useState({category:'',  title: '', description: '', imgURL: ''});
  const [newChapter, setNewChapter] = useState({chapterTitle: '', price: '', chapterHash: '', imgURL: ''});
  const [loading, setLoading] = useState(false);
  const [grading, setGrading] = useState([
    "戀愛漫畫",
    "科幻漫畫",
    "推理漫畫",
    "校園漫畫",
  ]);
  let temp = [];
  let chapterInfo = [];
  
  // 連接到 Web3 的函數
  async function connectToWeb3(){
    if (window.ethereum) {
      try {
        const web3 = new Web3(window.ethereum);
        setWeb3(web3);
        const contractInstance = new web3.eth.Contract(comicData.abi, comicData.address);
        setContract(contractInstance);

        await axios.get('http://localhost:5000/api/chapters')
        .then(response => {
          for (var i = 0; i < response.data.length; i++) {
            if (response.data[i].comic_id == temp[0].comicHash){
              chapterInfo.push(response.data[i]);
            }
          }
        })
        .catch(error => {
          console.error('Error fetching comics: ', error);
        });
        sortByTimestamp(chapterInfo);
        console.log(chapterInfo);

        for (var i = 0; i < chapterInfo.length; i++) {
          if (temp[0].author == currentAccount) {
            let id = 'Chapter' + (i+1);
            if (id == location.state.chapterID) {
              let price = chapterInfo[i].price;
              let imgURL = "http://localhost:5000/api/chapterIMG/" + chapterInfo[i].filename;
              setNewChapter({
                chapterTitle: chapterInfo[i].title,
                price: price,
                chapterHash: chapterInfo[i].chapter_id,
                imgURL: imgURL
              });
              setChapter({
                chapterTitle: chapterInfo[i].title,
                price: price,
                chapterHash: chapterInfo[i].chapter_id,
                imgURL: imgURL,
                filename: chapterInfo[i].filename
              })
            }
          }
        }
      } catch (error) {
        console.error(error);
      }
    } else {
      alert('請安裝 MetaMask 或其他支援的錢包');
    }
  };

  // 漫畫編輯函數
  const editComic = async (e) => {
    e.preventDefault();
    try {
      setComicHash(hashValue);
      const fillFile = await checkFile();
      if(fillFile === -1){
        return;
      }
      disableButton();
      updateMessage("正在編輯漫畫資料中...請稍後。")

      if (comic[0].category == newComic.category && comic[0].title == newComic.title && comic[0].description == newComic.description && !file) {
        alert('目前您未編輯任何東西!');
        updateMessage("");
        enableButton();
        return -1;
      }else if (comic[0].title != newComic.title) {  // 只變更title
        try {
          await contract.methods.editComic(comic[0].comicHash, newComic.title).send({ from: currentAccount });

          const formData = new FormData();
          formData.append('id', comic[0].comicHash);
          formData.append('title', newComic.title);
          formData.append('description', newComic.description);
          formData.append('category', newComic.category);
          formData.append('fileName', comic[0].filename);  // 原始圖檔名稱
          if (file) { // 有重新上傳圖片，重新產生新的fileName
            formData.append('comicIMG', file);  // 使用正确的字段名，这里是 'comicIMG'
          }
          await axios.put('http://localhost:5000/api/update/comicData', formData);
  
          alert('漫畫編輯成功！');
          window.location.replace("/creator");
        } catch (error) {
          alert('漫畫編輯失敗!');
          enableButton();
          updateMessage("");
        }
      } else {
        const formData = new FormData();
        formData.append('id', comic[0].comicHash);
        formData.append('title', newComic.title);
        formData.append('description', newComic.description);
        formData.append('category', newComic.category);
        formData.append('fileName', comic[0].filename);
        if (file) { // 有重新上傳圖片，重新產生新的fileName
          formData.append('comicIMG', file);  // 使用正确的字段名，这里是 'comicIMG'
        }
        await axios.put('http://localhost:5000/api/update/comicData', formData);

        alert('漫畫編輯成功！');
        window.location.replace("/creator");
      };
    } catch (error) {
      console.error('漫畫編輯時發生錯誤：', error);
      alert('漫畫編輯時發生錯誤!');
      enableButton();
      updateMessage("");
    }
  };


  // 章節編輯函數
  const editChapter = async (e) => {
    e.preventDefault();
    try {
      const fillFile = await checkFile();
      if(fillFile === -1){
        return;
      }
      if (newChapter.price < 0.01) {
        alert('價格至少0.01 ETH!');
        return;
      }
      disableButton();
      updateMessage("正在編輯章節資料中...請稍後。")

      if (chapter.price == newChapter.price && chapter.chapterTitle == newChapter.chapterTitle && !file) {
        alert('目前您未編輯任何東西!');
        updateMessage("");
        enableButton();
        return -1;
      } else if (chapter.price != newChapter.price || chapter.chapterTitle != newChapter.chapterTitle) {  // 章節價格或標題有變動
        try {
          let price_temp = parseFloat(newChapter.price);
          price_temp = web3.utils.toWei(price_temp, 'ether');
          await contract.methods.editChapter(comic[0].comicHash, chapter.chapterHash, newChapter.chapterTitle, price_temp).send({ from: currentAccount });

          const formData = new FormData();
          formData.append('id', chapter.chapterHash);
          formData.append('price', newChapter.price);
          formData.append('title', newChapter.chapterTitle);
          formData.append('fileName', chapter.filename);
          if (file) {
            formData.append('chapterIMG', file);  // 使用正确的字段名，这里是 'chapterIMG'
          }
          await axios.put('http://localhost:5000/api/update/chapterData', formData);

          alert('章節編輯成功！');
          window.location.href = `/chapterManagement/${comic[0].comicID}`;
        } catch (error) {
          alert('章節編輯失敗!');
          enableButton();
          updateMessage("");
        }
      }else {
        const formData = new FormData();
        formData.append('id', chapter.chapterHash);
        formData.append('price', newChapter.price);
        formData.append('title', newChapter.chapterTitle);
        formData.append('fileName', chapter.filename);
        if (file) {
          formData.append('chapterIMG', file);  // 使用正确的字段名，这里是 'chapterIMG'
        }
        await axios.put('http://localhost:5000/api/update/chapterData', formData);

        alert('章節編輯成功！');
        window.location.href = `/chapterManagement/${comic[0].comicID}`;
      };
      console.log("comicHash：" + comicHash);
      console.log("oldChapterHash：" + newChapter.chapterHash);
      console.log("newChapter_Hash：" + hashValue);
      console.log("chapterTitle：" + newChapter.chapterTitle);
      console.log("price：" + newChapter.price);
    } catch (error) {
      console.error('章節編輯時發生錯誤', error);
      alert('章節編輯時發生錯誤!');
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

  const handleFileInputChange = (event) => {
    const file = event.target.files[0];
    //setSelectedFile(file);
    setFile(file);
    if (validateFileType(file)) {
      previewImage(file);
    } else {
      alert("Invalid file type. Please upload an image in JPG, JPEG or PNG  format.");
      console.log("Invalid file type. Please upload an image in JPG, JPEG or PNG format.");
      return -1;
    }
    const reader = new FileReader();
    reader.onload = handleFileReaderLoad;
    reader.readAsArrayBuffer(file);
  };

  const handleFileReaderLoad = (event) => {  // 圖片轉為一 hash 值
    const fileBuffer = event.target.result;
    const hash = CryptoJS.SHA256(CryptoJS.lib.WordArray.create(fileBuffer));  // 計算 SHA-256 hash
    const hashValue = "0x" + hash.toString(CryptoJS.enc.Hex);
    console.log(hashValue);
    setHashValue(hashValue);
  };

  // 驗證檔案類型是否符合要求
  const validateFileType = (file) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    return allowedTypes.includes(file.type);
  };

  // 預覽圖片
  const previewImage = (file) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      setPreviewImageUrl(reader.result);
    };
  }; 

  // 漫畫類型取值
  function ChoseLevel(e){
    let choseLevel = e.target.value;
    setNewComic({ ...newComic, category: choseLevel })
  };

  async function checkFile() {
    if(showChapterForm == false){
      const {category, title, description} = newComic;
      // 檔案不可為空
      if( !category || !title || !description)  // || 其中一個為true，即為true
      {
        updateMessage("請填寫所有欄位！")
        return -1;
      }
    }else{
      const {chapterTitle, price} = newChapter;
      // 檔案不可為空
      if(!comicHash || !chapterTitle || !price)
      {
        updateMessage("請填寫所有欄位！")
        return -1;
      }
    };
  };

  useEffect(() => {
    if (chapterID == '') {
      connectToWeb3();
    }
  }, [chapterID]);

  useEffect(() => {
    // 检查是否传递了参数并设置 showChapterForm 状态
    if (location.state) {
      console.log("Location state:", location.state);
      setShowChapterForm(location.state.showChapterForm);
      const storedArrayJSON = localStorage.getItem('comicDatas');
      const storedArray = JSON.parse(storedArrayJSON);

      for (var i = 0; i < storedArray.length; i++) {
        if(storedArray[i].comicID == location.state.comicID){
          temp.push(storedArray[i]);
        };
      };
      console.log(temp);
      setComic(temp);
      let imgURL = "http://localhost:5000/api/comicIMG/" + temp[0].filename;
      setNewComic({category:temp[0].category,  title: temp[0].title, description: temp[0].description, imgURL: imgURL});
    
      if (location.state.chapterID) {
        setComicHash(temp[0].comicHash);
        setChapterID(location.state.chapterID);
      };
      setLoading(true);
    }
  }, [location]);


  return (
    <div className="upload-form">
      <div className="step-container">
        <div className={`step-item ${stepCompleted && !showChapterForm ? 'step-completed' : ''}`}>
          <div className="step-line">
            <div className={`line ${stepCompleted ? 'bg-blue' : 'bg-gray'}`}></div>
            <div className="dot">1</div>
            <div className={`line ${stepCompleted ? 'bg-blue' : 'bg-gray'}`}></div>
          </div>
          <div className="step-title">編輯漫畫</div>
        </div>
        <div className={`step-item ${!showChapterForm && !stepCompleted ? 'step-item-gray' : ''}`}>
          <div className="step-line">
            <div className={`line ${!showChapterForm && !stepCompleted ? 'bg-gray' : 'bg-blue'}`}></div>
            <div className="dot">2</div>
            <div className={`line ${!showChapterForm && !stepCompleted ? 'bg-gray' : 'bg-blue'}`}></div>
          </div>
          <div className="step-title">編輯章節</div>
        </div>
      </div>
      {loading ? (
        <>
          {showChapterForm ? (
              <div>
                <label htmlFor="name">本章名稱</label>
                <input
                  type="text"
                  value={newChapter.chapterTitle}
                  placeholder="請輸入章節名稱"
                  onChange={(e) => setNewChapter({ ...newChapter, chapterTitle: e.target.value })}
                />

                <label htmlFor="price">本章價格 (ETH)</label>
                <input
                  type="number"
                  value={newChapter.price}
                  placeholder="Min 0.01 ETH"
                  step="0.01"
                  onChange={(e) => setNewChapter({ ...newChapter, price: e.target.value })}
                />
                <label htmlFor="image">本章作品上傳，如不需變更章節內容，則無需上傳圖檔</label>
                <input
                  type="file"
                  onChange={handleFileInputChange}
                />
                <div style={{display: 'flex'}}>
                  <div style={{marginRight: '170px'}}>更改前的章節內容
                    <br />
                    <img
                      src={newChapter.imgURL}
                      alt="Preview"
                      style={{ width: '150px', paddingBottom: '3%', marginRight: '50px'}}
                    />
                  </div>
                  <div>更改後的章節內容
                    <br />
                    {previewImageUrl && (
                      <img
                        src={previewImageUrl}
                        alt="Preview"
                        style={{ width: '150px', paddingBottom: '3%' }}
                      />
                    )}
                    </div>
                </div>
                <div className="text-red-500 text-center">{message}</div>
                <button onClick={editChapter} id="list-button">提交</button>
              </div>
          ) : (
              <div>
                <label htmlFor="category">漫畫類型</label>
                <select value={newComic.category} onChange={ChoseLevel}>
                  <option>請選擇類型</option>
                  {grading.map((name, index) => (
                    <option key={index}>{name}</option>
                  ))}
                </select>
                <p></p>
                <label htmlFor="title">作品名稱</label>
                <input
                  type="text"
                  value={newComic.title}
                  onChange={(e) => setNewComic({ ...newComic, title: e.target.value })}
                />
                <label htmlFor="description">作品簡介</label>
                <textarea
                  cols="30"
                  rows="5"
                  value={newComic.description}
                  onChange={(e) => setNewComic({ ...newComic, description: e.target.value })}
                ></textarea>
                <label htmlFor="image">上傳漫畫封面，如不需變更封面，則無需上傳圖檔</label>
                <input
                  type="file"
                  onChange={handleFileInputChange}
                />
                <div style={{display: 'flex'}}>
                    <div style={{marginRight: '170px'}}>更改前的圖片封面
                      <br />
                      <img
                        src={newComic.imgURL}
                        alt="Preview"
                        style={{ width: '150px', paddingBottom: '3%', marginRight: '50px'}}
                      />
                    </div>
                    <div>更改後的圖片封面
                      <br />
                      {previewImageUrl && (
                        <img
                          src={previewImageUrl}
                          alt="Preview"
                          style={{ width: '150px', paddingBottom: '3%' }}
                        />
                      )}
                    </div>
                </div>
                <div className="text-red-500 text-center">{message}</div>
                <button onClick={editComic} id="list-button">提交</button>
              </div>
          )}
        </>
      ) : (
        <div className="loading-container">
          <div>資料未載入成功，請重新刷新...</div>
        </div>
      )}
    </div>
  );
};

export default EditWork;

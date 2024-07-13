import React, { useState, useEffect } from 'react';
import { uploadFileToIPFS } from "../pinata";
import Web3 from 'web3';
import comicData from '../contracts/ComicPlatform.json';
import $ from 'jquery';
import bs58 from 'bs58';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import CryptoJS from 'crypto-js';

const CreateWork = (props) => {
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [formParams, updateFormParams] = useState({title:'', description:'',  category: ''});
  const [formParams_1, updateFormParams_1] = useState({title: '', price: ''});
  const [message, updateMessage] = useState('');
  const [stepCompleted, setStepCompleted] = useState(false);
  const [showChapterForm, setShowChapterForm] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState(null);
  const [comicHash, setComicHash] = useState(''); // 儲存檔案哈希值的狀態
  const location = useLocation();
  const [hashValue, setHashValue] = useState('');
  const [file, setFiles] = useState('');
  const currentAccount = localStorage.getItem("currentAccount");
  const [grading, setGrading] = useState([
    "戀愛漫畫",
    "科幻漫畫",
    "推理漫畫",
    "校園漫畫",
  ]);
 
  // 連接到 Web3 的函數
  async function connectToWeb3(){
    if (window.ethereum) {
      try {
        // 請求用戶授權
        const web3 = new Web3(window.ethereum);
        setWeb3(web3);
        const contractInstance = new web3.eth.Contract(comicData.abi, comicData.address);
        setContract(contractInstance);
      } catch (error) {
        console.error(error);
      }
    } else {
      alert('請安裝 MetaMask 或其他支援的錢包');
    }
  };

  // 漫畫上傳函數
  const createComic = async (e) => {
    e.preventDefault();
    try {
      setComicHash(hashValue);
      const fillFile = await checkFile();
      if(fillFile === -1)
          return;
      if (!contract) {
        console.error('合約實例未初始化');
        return;
      }
      disableButton();
      updateMessage("正在上傳漫畫至合約中...請稍後。")

      console.log("comicHash：" + hashValue);
      console.log("title：" + formParams.title);
      console.log("author：" + currentAccount);
      console.log("description：" + formParams.description);
      console.log("level：" + formParams.category);
     
      await contract.methods.uploadComic(hashValue, formParams.title).send({ from: currentAccount });

      const formData = new FormData();
      formData.append('comicIMG', file); // 使用正确的字段名，这里是 'comicIMG'
      formData.append('creator', currentAccount);
      formData.append('title', formParams.title);
      formData.append('description', formParams.description);
      formData.append('category', formParams.category);
      formData.append('is_exist', 1);
      formData.append('comic_id', hashValue);

      try {
        const response = await axios.post('http://localhost:5000/api/add/comics', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        console.log('Comic added successfully:', response.data);

        alert('漫畫成功上傳！');
        enableButton();
        setShowChapterForm(true);
        updateMessage("");
        updateFormParams({category:'',  title: '', description: ''});
        setHashValue('');
        setFiles('');
      } catch (error) {
        console.error('Error adding comic:', error);
      }
    } catch (error) {
      console.error('上傳漫畫時發生錯誤：', error);
      alert('上傳漫畫時發生錯誤!' + error);
      enableButton();
      setShowChapterForm(false);
      updateMessage("");
    }
  };


  // 章節上傳函數
  const createChapter = async (e) => {
    e.preventDefault();
    try {
      const fillFile = await checkFile();
      if(fillFile === -1)
          return;
      if (!contract) {
        console.error('合約實例未初始化');
        return;
      }
      let price_temp = parseFloat(formParams_1.price);
      price_temp = web3.utils.toWei(price_temp, 'ether');
      if (price_temp < 10000000000000000) {
        alert('價格至少0.01 ETH!');
        return;
      }
      disableButton();
      updateMessage("正在添加章節至合約中...請稍後。")

      console.log("comicHash：" + comicHash);
      console.log("chapterHash：" + hashValue);
      console.log("title：" + formParams_1.title);
      console.log("price：" + formParams_1.price);

      await contract.methods.addChapter(comicHash, hashValue, formParams_1.title, price_temp).send({ from: currentAccount });

      const formData = new FormData();
      formData.append('chapterIMG', file); // 使用正确的字段名，这里是 'chapterIMG'
      formData.append('comic_id', comicHash);
      formData.append('price', formParams_1.price);
      formData.append('title', formParams_1.title);
      formData.append('chapter_hash', hashValue);

      try {
        const response = await axios.post('http://localhost:5000/api/add/chapters', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        console.log('chapter added successfully:', response.data);

        alert('章節成功添加！');
        enableButton();
        updateMessage("");
        updateFormParams_1({title: '', price: ''});
        window.location.replace("/creator");
      } catch (error) {
        console.error('章節內容添加至資料庫時發生錯誤：', error);
      }
    } catch (error) {
      console.error('添加章節時發生錯誤：', error);
      alert('添加章節時發生錯誤!' + error);
      enableButton();
      setShowChapterForm(true);
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
    setFiles(file);
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
    const hash = CryptoJS.SHA256(CryptoJS.lib.WordArray.create(fileBuffer));  // 计算 SHA-256 hash
    const timestamp = Date.now().toString(); // 获取当前时间戳，并转换为字符串
    const hashValue = hash.toString(CryptoJS.enc.Hex); // SHA-256 hash 值的十六进制表示
    const combinedValue = hashValue + timestamp; // 将 SHA-256 hash 值和時間戳串接
    const finalValue = "0x" + combinedValue.slice(-64);
    setHashValue(finalValue); // 设置最终的 hash 值
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

  // 漫畫等級取值
  function ChoseLevel(e){
    let choseLevel = e.target.value;
    formParams.category = choseLevel;
  };

  // 檔案不可為空
  async function checkFile() {
    if(showChapterForm == false){
      const {category, title, description} = formParams;
      if( !category || !title || !description || !hashValue)  // || 其中一個為true，即為true
      {
        updateMessage("請填寫所有欄位！")
        return -1;
      }
    }else{
      const {title, price} = formParams_1;
      if(!comicHash || !title || !price || !hashValue)
      {
        updateMessage("請填寫所有欄位！")
        return -1;
      }
    };
  };

  useEffect(() => {
    connectToWeb3();
  }, []);

  useEffect(() => {
    // 检查是否传递了参数并设置 showChapterForm 状态
    if (location.state && location.state.showChapterForm) {
      console.log("Location state:", location.state);
      setComicHash(location.state.comicHash);
      setShowChapterForm(true);
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
          <div className="step-title">新增漫畫</div>
        </div>
        <div className={`step-item ${!showChapterForm && !stepCompleted ? 'step-item-gray' : ''}`}>
          <div className="step-line">
            <div className={`line ${!showChapterForm && !stepCompleted ? 'bg-gray' : 'bg-blue'}`}></div>
            <div className="dot">2</div>
            <div className={`line ${!showChapterForm && !stepCompleted ? 'bg-gray' : 'bg-blue'}`}></div>
          </div>
          <div className="step-title">添加章節</div>
        </div>
      </div>
      {showChapterForm ? (
        <div>
          <label htmlFor="title">本章名稱</label>
          <input
            type="text"
            value={formParams_1.title}
            placeholder="請輸入章節名稱"
            onChange={(e) => updateFormParams_1({ ...formParams_1, title: e.target.value })}
          />

          <label htmlFor="price">本章價格 (ETH)</label>
          <input
            type="number"
            value={formParams_1.price}
            placeholder="Min 0.01 ETH"
            step="0.01"
            onChange={(e) => updateFormParams_1({ ...formParams_1, price: e.target.value })}
          />

          <label htmlFor="image">本章作品上傳</label>
          <input
            type="file"
            onChange={handleFileInputChange}
          />
          {previewImageUrl && (
            <img
              src={previewImageUrl}
              alt="Preview"
              style={{ width: '20%', paddingBottom: '3%' }}
            />
          )}

          <div className="text-red-500 text-center">{message}</div>
          <button onClick={createChapter} id="list-button">提交</button>

        </div>
      ) : (
        <div>
          <label htmlFor="category">漫畫類型</label>
          <select onChange={ChoseLevel}>
            <option>請選擇類型</option>
            {grading.map((name, index) => (
              <option key={index}>{name}</option>
            ))}
          </select>
          
          <p></p>
          <label htmlFor="title">作品名稱</label>
          <input
            type="text"
            value={formParams.title}
            onChange={(e) => updateFormParams({ ...formParams, title: e.target.value })}
          />

          <label htmlFor="description">作品簡介</label>
          <textarea
            cols="30"
            rows="5"
            value={formParams.description}
            onChange={(e) => updateFormParams({ ...formParams, description: e.target.value })}
          ></textarea>

          <label htmlFor="image">上傳漫畫封面</label>
          <input
            type="file"
            onChange={handleFileInputChange}
          />
          {previewImageUrl && (
            <img
              src={previewImageUrl}
              alt="Preview"
              style={{ width: '20%', paddingBottom: '3%' }}
            />
          )}

          <div className="text-red-500 text-center">{message}</div>
          <button onClick={createComic} id="list-button">提交</button>
        </div>
      )}
      
    </div>
  );
};

export default CreateWork;

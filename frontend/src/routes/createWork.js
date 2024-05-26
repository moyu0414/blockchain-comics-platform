import React, { useState, useEffect } from 'react';
import { uploadFileToIPFS } from "../pinata";
import Web3 from 'web3';
import createWork from '../contracts/ComicPlatform_0526.json';
import $ from 'jquery';
import bs58 from 'bs58';
import { useLocation } from 'react-router-dom';


const CreateWork = (props) => {
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [formParams, updateFormParams] = useState({level:'',  name: '', description: ''});
  const [formParams_1, updateFormParams_1] = useState({name: '', price: ''});
  const [message, updateMessage] = useState('');
  const [stepCompleted, setStepCompleted] = useState(false);
  const [showChapterForm, setShowChapterForm] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState(null);
  const [comicHash, setComicHash] = useState(''); // 儲存檔案哈希值的狀態
  const [chapterHash, setChapterHash] = useState(''); // 儲存檔案哈希值的狀態
  const location = useLocation();
  const [file, setFile] = useState('');
  const currentAccount = localStorage.getItem("currentAccount");
  const [grading, setGrading] = useState({
    "兒童漫畫": "1",
    "少年漫畫": "2",
    "少女漫畫": "3",
    "成人漫畫": "4",
  });
  
  // 連接到 Web3 的函數
  async function connectToWeb3(){
    if (window.ethereum) {
      try {
        // 請求用戶授權
        const web3 = new Web3(window.ethereum);
        setWeb3(web3);
        const contractInstance = new web3.eth.Contract(createWork.abi, createWork.address);
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
      const fillFile = await checkFile();
      if(fillFile === -1)
          return;
      if (!contract) {
        console.error('合約實例未初始化');
        return;
      }

      disableButton();
      updateMessage("正在上傳漫畫至合約中...請稍後。")
      let comic_Hash = '';
      try {
        //上傳圖片至 IPFS
        const response = await uploadFileToIPFS(file);
        if(response.success === true) {
          let CID = response.pinataURL.substr(34);  //取出 IPFS 回傳的 CID
          comic_Hash = getBytes32FromIpfsHash(CID);  //CID 轉 Hash 值
          setComicHash(comic_Hash);
        }
      }
      catch(e) {
          console.log("IPFS上傳時發生錯誤!", e);
      }

      console.log("comicHash：" + comic_Hash);
      console.log("title：" + formParams.name);
      console.log("author：" + currentAccount);
      console.log("description：" + formParams.description);
      console.log("title：" + formParams.level);

      await contract.methods.uploadComic(comic_Hash, formParams.name, currentAccount, formParams.description, formParams.level).send({ from: currentAccount });
      alert('漫畫成功上傳！');
      enableButton();
      setShowChapterForm(true);
      updateMessage("");
      updateFormParams({level:'',  name: '', description: ''});
    } catch (error) {
      console.error('上傳漫畫時發生錯誤：', error);
      alert('上傳漫畫時發生錯誤!');
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
      let chapter_Hash = '';
      try {
        //上傳圖片至 IPFS
        const response = await uploadFileToIPFS(file);
        if(response.success === true) {
          let CID = response.pinataURL.substr(34);  //取出 IPFS 回傳的 CID
          chapter_Hash = getBytes32FromIpfsHash(CID);  //CID 轉 Hash 值
          setComicHash(chapter_Hash);
        }
      }
      catch(e) {
          console.log("IPFS上傳時發生錯誤!", e);
      }
      console.log("chapterHash：" + chapter_Hash);
      console.log("title：" + formParams_1.name);
      console.log("price：" + formParams_1.price);
      await contract.methods.addChapter(comicHash, chapter_Hash, formParams_1.name, price_temp).send({ from: currentAccount });
      alert('章節成功添加！');
      enableButton();
      updateMessage("");
      updateFormParams_1({name: '', price: ''});
      window.location.replace("/creator");
    } catch (error) {
      console.error('添加章節時發生錯誤：', error);
      alert('添加章節時發生錯誤!');
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

  async function OnChangeFile(e) {
    var file = e.target.files[0];
    setFile(file);
    // 在這裡可以進行一些檔案類型、大小等的驗證
    if (file) {
      if (validateFileType(file)) {
          // 顯示圖片預覽
          setPreviewImageUrl(URL.createObjectURL(file));
      } else {
        // 檔案類型不符合要求，進行錯誤處理
        alert("Invalid file type. Please upload an image in JPG, JPEG or PNG  format.");
        console.log("Invalid file type. Please upload an image in JPG, JPEG or PNG format.");
        return -1;
      }
    }
  }

  
  // 將 CID 轉換為 32 bytes
  function getBytes32FromIpfsHash(ipfsListing) {
    let a = bs58.decode(ipfsListing);
    return "0x"+bs58.decode(ipfsListing).slice(2).toString('hex')
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
    let level = {"兒童漫畫": "1", "少年漫畫": "2", "少女漫畫": "3", "成人漫畫": "4"};
    let Level = Object.keys(level);
    for (var i = 0; i < Level.length; i++) {
      let name = Level[i];
      if(choseLevel == name){
        formParams.level = i+1;
      };
    }
  };

  async function checkFile() {
    if(showChapterForm == false){
      const {level, name, description} = formParams;
      // 檔案不可為空
      if( !level || !name || !description || !file)  // || 其中一個為true，即為true
      {
        updateMessage("請填寫所有欄位！")
        return -1;
      }
    }else{
      const {name, price} = formParams_1;
      // 檔案不可為空
      if(!comicHash || !file || !name || !price)
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
      //console.log("Show chapter form:", true);
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
          <label htmlFor="name">本章名稱</label>
          <input
            type="text"
            value={formParams_1.name}
            placeholder="請輸入章節名稱"
            onChange={(e) => updateFormParams_1({ ...formParams_1, name: e.target.value })}
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
            onChange={OnChangeFile}
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
          <label htmlFor="level">漫畫分級</label>
          <select onChange={ChoseLevel}>
            <option>請選擇分級</option>
            {Object.keys(grading).map((name, index) => (
              <option key={index}>{name}</option>
            ))}
          </select>
          
          <p></p>
          <label htmlFor="name">作品名稱</label>
          <input
            type="text"
            value={formParams.name}
            onChange={(e) => updateFormParams({ ...formParams, name: e.target.value })}
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
            onChange={OnChangeFile}
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

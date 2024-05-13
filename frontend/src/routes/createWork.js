import React, { useState, useEffect } from 'react';
import { uploadFileToIPFS } from "../pinata";
import Web3 from 'web3';
import createWork from '../contracts/ComicPlatform.json';
import $ from 'jquery';
import bs58 from 'bs58';
import { Buffer } from 'buffer';


const CreateWork = () => {
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState('');
  const [formParams, updateFormParams] = useState({level:'',  name: '', description: ''});
  const [formParams_1, updateFormParams_1] = useState({name: '', price: ''});
  const [message, updateMessage] = useState('');
  const [stepCompleted, setStepCompleted] = useState(false);
  const [showChapterForm, setShowChapterForm] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState(null);
  const [comicHash, setComicHash] = useState(''); // 儲存檔案哈希值的狀態
  const [chapterHash, setChapterHash] = useState(''); // 儲存檔案哈希值的狀態
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
        //console.log('Web3 instance:', web3); // 檢查 Web3 實例
        setWeb3(web3);

        const contractInstance = new web3.eth.Contract(createWork.abi, createWork.address);
        //console.log('Contract instance:', contractInstance); // 檢查合約實例

        // 獲取用戶帳戶
        const accounts = await web3.eth.getAccounts();
        setAccount(accounts[0]);

        //console.log(contractInstance);
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
      console.log("comicHash：" + comicHash);
      console.log("title：" + formParams.name);
      console.log("author：" + account);
      console.log("description：" + formParams.description);
      console.log("title：" + formParams.level);
      updateMessage("正在上傳漫畫至合約中...請稍後。")
  
      await contract.methods.uploadComic(comicHash, formParams.name, account, formParams.description, formParams.level).send({ from: account });
      alert('漫畫成功上傳！');
      enableButton();
      setShowChapterForm(true);
      updateMessage("");
      updateFormParams({level:'',  name: '', description: ''});
  
      // 更新localStorage中的作品資料
      const newComic = {
        title: formParams.name,
        author: account,
        description: formParams.description,
        level: formParams.level,
        comicHash: comicHash // 可能需要更多的作品資料
      };
  
      // 從localStorage中獲取現有的作品資料
      const storedArrayJSON = localStorage.getItem('comicDatas');
      const storedArray = storedArrayJSON ? JSON.parse(storedArrayJSON) : [];
  
      // 添加新的作品資料到作品列表
      const updatedComicList = [...storedArray, newComic];
  
      // 將更新後的作品列表保存回localStorage中
      localStorage.setItem('comicDatas', JSON.stringify(updatedComicList));
  
      // 重新加載首頁
      window.location.reload();
  
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
      disableButton();
      console.log("chapterHash：" + chapterHash);
      console.log("title：" + formParams_1.name);
      console.log("price：" + formParams_1.price);
      let price_temp = parseFloat(formParams_1.price);
      price_temp = web3.utils.toWei(price_temp, 'ether'); 
      updateMessage("正在添加章節至合約中...請稍後。")

      await contract.methods.addChapter(comicHash, chapterHash, formParams_1.name, price_temp).send({ from: account });
     
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

  //圖檔上傳到 IPFS (Pinata)，得到 CID 再轉成 Hash 格式，並檢查圖檔格式
  async function OnChangeFile(e) {
    var file = e.target.files[0];
    // 在這裡可以進行一些檔案類型、大小等的驗證
    if (file) {
      if (validateFileType(file)) {
          // 顯示圖片預覽
          setPreviewImageUrl(URL.createObjectURL(file));
          try {
            //上傳圖片至 IPFS
            disableButton();
            if (showChapterForm == false){
              updateMessage("正在上傳漫畫封面...請稍候。")
            }else{
              updateMessage("正在上傳章節內容...請稍候。")
            };
            const response = await uploadFileToIPFS(file);
            if(response.success === true) {
                enableButton();
                updateMessage("")
                let CID = response.pinataURL.substr(34);  //取出 IPFS 回傳的 CID
                let temp_Hash = getBytes32FromIpfsHash(CID);  //CID 轉 Hash 值

                if (showChapterForm == false){
                  setComicHash(temp_Hash);
                  alert('已將漫畫封面上傳至 Pinata!');
                  console.log("已將漫畫封面上傳至 Pinata!")
                  //console.log("comicHash：" + temp_Hash);
                }else{
                  setChapterHash(temp_Hash);
                  alert('已將章節內容上傳至 Pinata!');
                  console.log("已將章節內容上傳至 Pinata!")
                  //console.log("chapterHash：" + temp_Hash);
                };
            }
        }
        catch(e) {
            console.log("IPFS上傳時發生錯誤!", e);
        }
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



  // 將 32 bytes 還原成 CID
  function getIpfsHashFromBytes32(bytes32Hex) {
    // and cut off leading "0x"
    const hashHex = "1220" + bytes32Hex.slice(2);
    const hashBytes = Buffer.from(hashHex, 'hex');
    const hashStr = bs58.encode(hashBytes)
    return hashStr
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
    if( !level || !name || !description || !comicHash)  // || 其中一個為true，即為true
    {
      updateMessage("請填寫所有欄位！")
      return -1;
    }
  }else{
    const {name, price} = formParams_1;
    // 檔案不可為空
    if(!comicHash || !chapterHash || !name || !price)
    {
      updateMessage("請填寫所有欄位！")
      return -1;
    }
  };
};

  useEffect(() => {
    connectToWeb3();
  }, []);


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

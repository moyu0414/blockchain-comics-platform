import React, { useState, useEffect } from 'react';
import { uploadFileToIPFS } from "../pinata";
import Web3 from 'web3';
import createWork from '../contracts/CreateWork_New.json';
import $ from 'jquery';

let contractInstance = null;

const CreateWork = () => {
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState('');
  
  const [formParams, updateFormParams] = useState({level:'',  name: '', description: ''});
  const [formParams_1, updateFormParams_1] = useState({name: '', price: ''});
  const [message, updateMessage] = useState('');

  const [stepCompleted, setStepCompleted] = useState(false);
  const [showChapterForm, setShowChapterForm] = useState(true);
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
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const web3Instance = new Web3(window.ethereum);
        setWeb3(web3Instance);

        // 獲取用戶帳戶
        const accounts = await web3Instance.eth.getAccounts();
        setAccount(accounts[0]);

        contractInstance = new web3Instance.eth.Contract(
          createWork.abi,
          createWork.address,
        );
        //console.log(contractInstance);
        setContract(contractInstance);

        const voteCount = await contractInstance.methods;
        console.log(voteCount);


        let a = '0.03';
        a = parseFloat(a);
        console.log(typeof(a));

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
      // 呼叫合約的創建投票方法
      console.log("comicHash：" + comicHash);
      console.log("title：" + formParams.name);
      console.log("author：" + account);
      console.log("description：" + formParams.description);
      console.log("title：" + formParams.level);
      updateMessage("Uploading BlockChain(takes 5 mins).. please dont click anything!")

      await contract.methods.uploadComic(comicHash, formParams.name, account, formParams.description, formParams.level).send({ from: account });
      alert('成功創建漫畫！');
      enableButton();
      setShowChapterForm(true);
      updateMessage("");
      //updateFormParams({level:'',  name: '', description: '', price: ''});
    } catch (error) {
      console.error('創建漫畫失敗', error);
      alert('創建漫畫失敗！');
      enableButton();
      setShowChapterForm(false);
      updateMessage("");
    }
  };


  // 章節上傳函數
  const createChapter = async (e) => {
    e.preventDefault();
    try {
      let a = '0x3a14f1922f1ff570364319f23f9bc756ca66d979f267d0838e46d8bdda3788e6';
      console.log("comicHash：" + a);
      setComicHash(a);

      const fillFile = await checkFile();
      if(fillFile === -1)
          return;
      if (!contract) {
        console.error('合約實例未初始化');
        return;
      }

      disableButton();
      // 呼叫合約的創建投票方法

      //console.log("comicHash：" + comicHash);
      console.log("chapterHash：" + chapterHash);
      console.log("title：" + formParams_1.name);
      console.log("price：" + formParams_1.price);

      //let b = web3.utils.toHex(formParams_1.price);
      //console.log(b);

      updateMessage("Uploading BlockChain(takes 5 mins).. please dont click anything!")

      let price_temp = parseFloat(formParams_1.price);
      //price_temp = parseFloat(formParams_1.price);
      //console.log(typeof(b));
      price_temp = web3.utils.toWei(price_temp, 'ether');
      //const price_temp = web3.utils.soliditySha3( '2');
      //price_temp = web3.utils.toWei(formParams_1.price);
      //price_temp = "0x" + parseFloat(formParams_1.price).toString(16);


      console.log("price_temp：" + price_temp);

      //await contract.methods.uploadComic(comicHash, chapterHash, formParams.name, formParams.description, price).send({ from: account });
      await contract.methods.addChapter(a, chapterHash, formParams_1.name, price_temp).send({ from: account });
     
      alert('成功創建章節！');
      enableButton();
    } catch (error) {
      console.error('創建章節失敗', error);
      alert('創建章節失敗！');
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

          //check for file extension
          try {
            //upload the file to IPFS
            disableButton();
            if (showChapterForm == false){
              updateMessage("Uploading image to Pinata. Please dont click anything!")
            }else{
              updateMessage("Uploading chapter content.. please don't click anything!")
            };
            const response = await uploadFileToIPFS(file);
            if(response.success === true) {
                enableButton();
                updateMessage("")
                let temp_Hash = response.pinataURL.substr(34);
                temp_Hash = web3.utils.soliditySha3(temp_Hash);
                
                //let b1 = web3.utils.utf8ToHex(temp_Hash).substr(0, 66);
                //console.log("b1：" + b1);
                //temp_Hash = web3.utils.hexToBytes(b1);
                //console.log("temp_Hash：" + temp_Hash);

                
                if (showChapterForm == false){
                  setComicHash(temp_Hash);
                  //console.log("Uploaded image to Pinata: ", response.pinataURL)
                  console.log("comicHash：" + temp_Hash);
                }else{
                  setChapterHash(temp_Hash);
                  //console.log("Uploaded chapter content to Pinata: ", response.pinataURL)
                  console.log("chapterHash：" + temp_Hash);
                };
            }
        }
        catch(e) {
            console.log("Error during file upload", e);
        }
      } else {
        // 檔案類型不符合要求，進行錯誤處理
        alert("Invalid file type. Please upload an image in JPG, JPEG, or PNG format.");
        console.log("Invalid file type. Please upload an image in JPG, JPEG, or PNG format.");
        return -1;
      }
    }
  }

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


function ChoseLevel(e){
  let choseLevel = e.target.value;
  let level = {"兒童漫畫": "1", "少年漫畫": "2", "少女漫畫": "3", "成人漫畫": "4"};
  let Level = Object.keys(level);
  for (var i = 0; i < Level.length; i++) {
    let name = Level[i];
    if(choseLevel == name){
      formParams.level = i;
      //console.log(formParams.level);
    };
  }
};


async function checkFile() {
  if(showChapterForm == false){
    const {level, name, description} = formParams;
    //Make sure that none of the fields are empty
    if( !level || !name || !description || !comicHash)  // || 其中一個為true，即為true
    {
      updateMessage("Please fill all the fields!")
      return -1;
    }
  }else{
    const {name, price} = formParams_1;
    //Make sure that none of the fields are empty
    if(!comicHash || !chapterHash || !name || !price)
    {
      updateMessage("Please fill all the fields!")
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

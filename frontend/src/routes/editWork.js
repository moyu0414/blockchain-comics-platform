import React, { useState, useEffect } from 'react';
import { uploadFileToIPFS } from "../pinata";
import Web3 from 'web3';
import createWork from '../contracts/ComicPlatform_0526.json';
import $ from 'jquery';
import bs58 from 'bs58';
import { useLocation } from 'react-router-dom';
import { getIpfsHashFromBytes32 } from '../index';


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
  const [file, setFile] = useState('');
  const [chapterID, setChapterID] = useState('');
  const currentAccount = localStorage.getItem("currentAccount");
  const [comic, setComic] = useState([]);
  const [chapter, setChapter] = useState([]);
  const [newComic, setNewComic] = useState({level:'',  name: '', description: '', cid: '', hash: ''});
  const [newChapter, setNewChapter] = useState({chapterTitle: '', price: '', chapterHash: '', imgURL: ''});
  const [loading, setLoading] = useState(false);
  const [grading, setGrading] = useState({
    "兒童漫畫": "1",
    "少年漫畫": "2",
    "少女漫畫": "3",
    "成人漫畫": "4",
  });
  let temp = [];
  
  // 連接到 Web3 的函數
  async function connectToWeb3(){
    if (window.ethereum) {
      try {
        const web3 = new Web3(window.ethereum);
        setWeb3(web3);
        const contractInstance = new web3.eth.Contract(createWork.abi, createWork.address);
        setContract(contractInstance);
        let meta = await contractInstance.methods;
        const chapterInfo = await meta.getChapters(temp[0].hash).call();  //所有章節資料

        let num = 1;
        for (var i = 0; i < chapterInfo[0].length; i++) {
          if (temp[0].author == currentAccount) {
            let id = 'Chapter' + num;
            if (id == location.state.chapterID) {
              let temp_price = chapterInfo[2][i].toString();
              temp_price = temp_price / 1e18;
              let cid = await getIpfsHashFromBytes32(chapterInfo[0][i]);
              let getURL = "https://apricot-certain-boar-955.mypinata.cloud/ipfs/" + cid + "?pinataGatewayToken=DlQddJX0ZBG74RznFKeBXWq0i24fOuD8ktnJMofUAYUuBlmhKKtKs01175WVvh5N";
              setNewChapter({
                chapterTitle: chapterInfo[1][i],
                price: temp_price,
                chapterHash: chapterInfo[0][i],
                imgURL: getURL
              });
              setChapter({
                chapterTitle: chapterInfo[1][i],
                price: temp_price,
                chapterHash: chapterInfo[0][i],
                imgURL: getURL
              })
            }
            num = num + 1;
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
      const fillFile = await checkFile();
      if(fillFile === -1)
          return;
      if (!contract) {
        console.error('合約實例未初始化');
        return;
      }

      disableButton();
      let comic_Hash = '';
      if ((comic[0].level != newComic.level || comic[0].title != newComic.name || comic[0].description != newComic.description) && file == '') {  // 合約：編輯漫畫data
        updateMessage("正在編輯漫畫資料至合約中...請稍後。")
        await contract.methods.editcomicdata(newComic.hash, newComic.name, currentAccount, newComic.description, newComic.level).send({ from: currentAccount });
      } else if (file != '') {  // 合約：編輯漫畫hash
        try {
          updateMessage("正在編輯漫畫封面至合約中...請稍後。")
          const response = await uploadFileToIPFS(file);
          if(response.success === true) {
            let CID = response.pinataURL.substr(34);
            comic_Hash = getBytes32FromIpfsHash(CID);
            setComicHash(comic_Hash);  //更改後的漫畫hash
          }
        }
        catch(e) {
          alert("IPFS上傳時發生錯誤");
          console.log("IPFS上傳時發生錯誤!", e);
        }
        await contract.methods.editcomichash(newComic.hash, comic_Hash).send({ from: currentAccount });

        if (comic[0].level != newComic.level || comic[0].title != newComic.name || comic[0].description != newComic.description) {  // 合約：編輯漫畫hash(已完成) => 編輯漫畫data
          updateMessage("正在編輯漫畫資料至合約中...請稍後。")
          await contract.methods.editcomicdata(comic_Hash, newComic.name, currentAccount, newComic.description, newComic.level).send({ from: currentAccount });
        };
      } else {
        alert('目前您未編輯任何東西!');
        updateMessage("");
        enableButton();
        return -1;
      };
      console.log("comicHash：" + newComic.hash);
      console.log("comic_Hash：" + comic_Hash);
      console.log("title：" + newComic.name);
      console.log("author：" + currentAccount);
      console.log("description：" + newComic.description);
      console.log("level：" + newComic.level);
      alert('漫畫編輯成功！');
      enableButton();
      updateMessage("");
      window.location.replace("/editWork");
      window.location.replace("/creator");
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
      if(fillFile === -1)
          return;
      if (!contract) {
        console.error('合約實例未初始化');
        return;
      }
      let price_temp = parseFloat(newChapter.price);
      price_temp = web3.utils.toWei(price_temp, 'ether');
      if (price_temp < 10000000000000000) {
        alert('價格至少0.01 ETH!');
        return;
      }
      disableButton();
      let chapter_Hash = '';
      if ((chapter.chapterTitle != newChapter.chapterTitle || chapter.price != newChapter.price) && file == '') {  // 合約：編輯章節data
        updateMessage("正在編輯章節資料至合約中...請稍後。")
        await contract.methods.editchapterdata(comicHash, newChapter.chapterHash, newChapter.chapterTitle, price_temp).send({ from: currentAccount });
      } else if (file != '') {  // 合約：編輯章節hash
        try {
          updateMessage("正在編輯章節圖檔至合約中...請稍後。")
          const response = await uploadFileToIPFS(file);
          if(response.success === true) {
            let CID = response.pinataURL.substr(34);
            chapter_Hash = getBytes32FromIpfsHash(CID);
            setChapterHash(chapter_Hash);  //更改後的章節hash
          }
        }
        catch(e) {
          alert("IPFS上傳時發生錯誤");
          console.log("IPFS上傳時發生錯誤!", e);
        }
        await contract.methods.editchapterhash(comicHash, chapter.chapterHash , chapter_Hash).send({ from: currentAccount });

        if (chapter.chapterTitle != newChapter.chapterTitle || chapter.price != newChapter.price) {  // 合約：編輯漫畫hash(已完成) => 編輯漫畫data
          updateMessage("正在編章節資料至合約中...請稍後。")
          await contract.methods.editchapterdata(comicHash, chapter_Hash, newChapter.chapterTitle, price_temp).send({ from: currentAccount });
        };
      } else {
        alert('目前您未編輯任何東西!');
        updateMessage("");
        enableButton();
        return -1;
      };
      console.log("comicHash：" + comicHash);
      console.log("chapterHash：" + newChapter.chapttemp_chaptererHash);
      console.log("chapter_Hash：" + chapter_Hash);
      console.log("chapterTitle：" + newChapter.chapterTitle);
      console.log("price：" + newChapter.price);
      alert('章節編輯成功！');
      enableButton();
      updateMessage("");
      window.location.replace("/editWork");
      window.location.href = `/chapterManagement/${comic[0].comicID}`;
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
        setNewComic({ ...newComic, level: i+1 })
      };
    }
  };

  function levelToKey(levelNumber) {
    let levelMap = {"1": "兒童漫畫", "2": "少年漫畫", "3": "少女漫畫", "4": "成人漫畫"};
    return levelMap[levelNumber];
  }

  async function checkFile() {
    if(showChapterForm == false){
      const {level, name, description} = newComic;
      // 檔案不可為空
      if( !level || !name || !description)  // || 其中一個為true，即為true
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
      //console.log("Location state:", location.state);
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
      setNewComic({level:temp[0].level,  name: temp[0].title, description: temp[0].description, cid: temp[0].cid, hash:temp[0].hash});
      
      if (location.state.chapterID) {
        setComicHash(temp[0].hash);
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
                  onChange={OnChangeFile}
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
                <label htmlFor="level">漫畫分級</label>
                <select value={levelToKey(newComic.level)} onChange={ChoseLevel}>
                  <option>請選擇分級</option>
                  {Object.keys(grading).map((name, index) => (
                    <option key={index} >{name}</option>
                  ))}
                </select>
                <p></p>
                <label htmlFor="name">作品名稱</label>
                <input
                  type="text"
                  value={newComic.name}
                  onChange={(e) => setNewComic({ ...newComic, name: e.target.value })}
                />
                <label htmlFor="description">作品簡介</label>
                <textarea
                  cols="30"
                  rows="5"
                  value={newComic.description}
                  onChange={(e) => setNewComic({ ...newComic, description: e.target.value })}
                ></textarea>
                <label htmlFor="image">上傳漫畫封面，如不需變更圖片封面，則無需上傳圖檔</label>
                <input
                  type="file"
                  onChange={OnChangeFile}
                />
                <div style={{display: 'flex'}}>
                    <div style={{marginRight: '170px'}}>更改前的圖片封面
                      <br />
                      <img
                        src={newComic.cid}
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

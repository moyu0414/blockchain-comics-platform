import React, { useState, useEffect } from 'react';
import { Form, Row, Col, Button, ProgressBar } from 'react-bootstrap';
import { CardImage } from 'react-bootstrap-icons';
import Web3 from 'web3';
import comicData from '../contracts/ComicPlatform.json';
import $ from 'jquery';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

const MintNFT = (props) => {
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [message, updateMessage] = useState('');
  const [stepCompleted, setStepCompleted] = useState(false);
  const [showChapterForm, setShowChapterForm] = useState(false);
  const location = useLocation();
  const currentAccount = localStorage.getItem("currentAccount");
  const [comic, setComic] = useState([]);
  const [newComic, setNewComic] = useState({category:'',  title: '', description: '', imgURL: ''});
  const [NFTData, setNFTData] = useState({price:'', description: '', comicHash:''});
  const [loading, setLoading] = useState(false);
  let temp = [];
  
  // 連接到 Web3 的函數
  async function connectToWeb3(){
    if (window.ethereum) {
      try {
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

  // 漫畫編輯函數
  const createNFT = async (e) => {
    e.preventDefault();
    try {
      const fillFile = await checkFile();
      if(fillFile === -1)
          return;
      if (!contract) {
        console.error('合約實例未初始化');
        return;
      }
      let price_temp = parseFloat(NFTData.price);
      price_temp = web3.utils.toWei(price_temp, 'ether');
      if (price_temp < 10000000000000000) {
        alert('價格至少0.01 ETH!');
        return;
      }
      disableButton();
      updateMessage("正在鑄造NFT中...請稍後。")

      console.log("comicHash：" + NFTData.comicHash);
      console.log("price：" + NFTData.price);
      console.log("description：" + NFTData.description);
     
      await contract.methods.mintNFT(price_temp, NFTData.description, NFTData.comicHash).send({ from: currentAccount });

      alert('鑄造NFT成功！');
      enableButton();
      updateMessage("");
      window.location.replace(`/chapterManagement/${location.state.comicID}`);
    } catch (error) {
      console.error('鑄造NFT時發生錯誤：', error);
      alert('鑄造NFT時發生錯誤!' + error);
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

  async function checkFile() {
    const {price, description} = NFTData;
    // 檔案不可為空
    if( !price || !description)  // || 其中一個為true，即為true
    {
      updateMessage("請填寫所有欄位！")
      return -1;
    }
  };

  useEffect(() => {
    if (location.state) {
      console.log("Location state:", location.state);
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
      let coverImg = '';
      if (temp[0].protoFilename) {
        coverImg = `http://localhost:5000/api/coverFile/${temp[0].filename}/${temp[0].protoFilename}`;
      }
      setNewComic({category:temp[0].category,  title: temp[0].title, description: temp[0].description, imgURL: imgURL, coverImg: coverImg});
      setNFTData({comicHash: temp[0].comicHash})
      connectToWeb3();
      setLoading(true);
    }
  }, [location]);

  const [grading, setGrading] = useState([
    "素材使用",
    "會員標章",
    "智慧財產"
  ]);


  return (
    <div className="upload-form">
      <div className="step-container">
        <div className={`step-item ${stepCompleted && !showChapterForm ? 'step-completed' : ''}`}>
          <div className="step-line">
            <div className={`line ${stepCompleted ? 'bg-blue' : 'bg-gray'}`}></div>
            <div className="dot">1</div>
            <div className={`line ${stepCompleted ? 'bg-blue' : 'bg-gray'}`}></div>
          </div>
          <div className="step-title">漫畫資訊</div>
        </div>
        <div className={`step-item ${!showChapterForm && !stepCompleted ? 'step-item-gray' : ''}`}>
          <div className="step-line">
            <div className={`line ${!showChapterForm && !stepCompleted ? 'bg-gray' : 'bg-blue'}`}></div>
            <div className="dot">2</div>
            <div className={`line ${!showChapterForm && !stepCompleted ? 'bg-gray' : 'bg-blue'}`}></div>
          </div>
          <div className="step-title">鑄造NFT</div>
        </div>
      </div>
      {/* {loading ? ( */}
        <div>
          <div style={{ float: 'left', width: '45%', marginRight: '5%' }}>
            <label htmlFor="category">漫畫類型：{newComic.category}</label>
            <br />
            <label htmlFor="title">作品名稱：{newComic.title}</label>
            <br />
            <label htmlFor="description">作品簡介：{newComic.description}</label>
            <br />
            <label htmlFor="image">漫畫封面：</label>
            <div style={{ display: 'flex' }}>
              <img
                src={newComic.imgURL}
                alt="Preview"
                style={{ width: '80%', paddingBottom: '3%' }}
              />
            </div>
            <br />
            <label htmlFor="image">橫向封面(推廣頁)：</label>
            <div style={{ display: 'flex' }}>
              {newComic.coverImg ? (
                <img
                  src={newComic.coverImg}
                  alt="Preview"
                  style={{ width: '80%', paddingBottom: '3%' }}
                />
              ) : (
                <div>
                  目前無上傳橫向封面
                </div>
              )}
            </div>
          </div>

          <div style={{ float: 'left', width: '45%', marginLeft: '5%' }}>
            <label htmlFor="category">NFT價格：</label>
            <input
              type="number"
              placeholder="Min 0.01 ETH"
              step="0.01"
              style={{ width: '80%' }}
              onChange={(e) => setNFTData({ ...NFTData, price: e.target.value })}
            />
            <br />
            <label htmlFor="description">作品描述：</label>
            <textarea
              cols="30"
              rows="10"
              style={{ width: '80%' }}
              onChange={(e) => setNFTData({ ...NFTData, description: e.target.value })}
            ></textarea>
          </div>
          <div style={{ clear: 'both' }}></div>
          <div className="text-red-500 text-center">{message}</div>
          <button onClick={createNFT} id="list-button">提交</button>
        </div>
        {/* ) : ( */}
        <Form.Group>
          <Form.Label className="upload-block">
            <CardImage size={48} />
            <h5>選取圖片</h5>
            <Form.Control
              type="file"
              style={{ display: 'none' }} // 隱藏實際的檔案上傳按鈕
            />
          </Form.Label>
        </Form.Group>

        <Form.Group as={Row} className='mt-4 mb-2'>
          <Form.Label >
              NFT名稱
          </Form.Label>
          <Form.Control
            type="text"
            placeholder="請輸入NFT名稱"
            // value={newChapter.chapterTitle}
            // onChange={}
          />
        </Form.Group>

        <Form.Group as={Row} className='mb-2'>
          <Form.Label>
          NFT價格
          </Form.Label>
            <Form.Control
              type="number"
              placeholder="Min 0.01 ETH"
              step="0.01"
              // value={newChapter.price}
              // onChange={(e) => setNewChapter({ ...newChapter, price: e.target.value })}
            />
        </Form.Group>

        <Form.Group as={Row} className='mb-2'>
          <Form.Label>
            漫畫類別
          </Form.Label>
            <Form.Control
              as="select"
              className="form-select"
              // value={newComic.category}
              // onChange={ChoseLevel}
            >
              <option>請選擇NFT類型</option>
              {grading.map((name, index) => (
                <option key={index}>{name}</option>
              ))}
            </Form.Control>
        </Form.Group>

        <Form.Group className='mb-4'>
          <Form.Label>NFT敘述</Form.Label>
            <Form.Control
              as="textarea"
              rows={5}
              // value={newComic.description}
              // onChange={(e) => setNewComic({ ...newComic, description: e.target.value })}
            />
        </Form.Group>

        <Form.Group as={Row} className='mb-2'>
          <Form.Label>
          發行數量
          </Form.Label>
            <Form.Control
              type="number"
              // value={newChapter.price}
              // onChange={(e) => setNewChapter({ ...newChapter, price: e.target.value })}
            />
        </Form.Group>
        <Button id="list-button">
          確定鑄造
        </Button>
        {/* )} */}
      </div>
  );
};

export default MintNFT;

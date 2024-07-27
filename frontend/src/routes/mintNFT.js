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
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [showDescription, setShowDescription] = useState(false);
  let temp = [];
  
  // 連接到 Web3 的函數
  async function connectToWeb3(){
    if (window.ethereum) {
      try {
        const web3 = new Web3(window.ethereum);
        setWeb3(web3);
        const contractInstance = new web3.eth.Contract(comicData.abi, comicData.address);
        setContract(contractInstance);
        console.log(contractInstance);

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
      setShowChapterForm(location.state.showChapterForm)
      connectToWeb3();
      setLoading(true);
    }
  }, [location]);

  const [grading, setGrading] = useState([
    "素材使用",
    "會員標章",
    "智慧財產"
  ]);

  const handleCategoryChange = (event) => {
    const { value, checked } = event.target;
    setSelectedCategories(prevState => {
      const updatedCategories = checked
        ? [...prevState, value]
        : prevState.filter(category => category !== value);

      if (updatedCategories.includes('其他：自行創建')) {
        setShowDescription(true);
      } else {
        setShowDescription(false);
      }

      return updatedCategories;
    });
  };


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





      <Form.Group as={Row} className='mb-1'>
        <div style={{ display: 'flex' }}>
          <Form.Label className='label-style col-form-label'>
            漫畫名稱
          </Form.Label>
          <Form.Control
            type="text"
            value={newComic.title}
            style={{ marginLeft: '10px' }}
          />
        </div>
      </Form.Group>

      <Form.Group as={Row} className='mb-3'>
        <div style={{ display: 'flex' }}>
          <Form.Label className='label-style mb-1 col-form-label'>
            漫畫類別
          </Form.Label>
          <Form.Control
            className="form-select"
            value={newComic.category}
            style={{ marginLeft: '10px' }}
          >
          </Form.Control>
        </div>
      </Form.Group>

      <Form.Group className='pb-3'>
        <div style={{ display: 'flex'}}>
          <Form.Label className='label-style col-form-label'>
            漫畫簡介
          </Form.Label>
          <Form.Control
            as="textarea"
            rows={5}
            value={newComic.description}
            style={{ marginLeft: '10px' }}
          />
        </div>
      </Form.Group>

      <Form.Group className='pb-3'>
        <div style={{ display: 'flex' }}>
          <Form.Label className='label-style mb-1 col-form-label' htmlFor="image">
            漫畫封面
          </Form.Label>
          <img
            src={newComic.imgURL}
            alt="Preview"
            style={{ width: '60%', maxWidth: '300px', paddingBottom: '3%', marginLeft: '10px' }}
          />
        </div>
      </Form.Group>
        
      <Form.Group className='pb-4'>
        <div style={{ display: 'flex' }}>
          <Form.Label className='label-style mb-1 col-form-label'>漫畫橫向封面</Form.Label>
          {newComic.coverImg ? (
            <img
              src={newComic.coverImg}
              alt="Preview"
              style={{ width: '60%', maxWidth: '300px', paddingBottom: '3%', marginLeft: '10px' }}
            />
          ) : (
            <div>
              <h3>目前無上傳橫向封面</h3>
              <br />
            </div>
          )}
        </div>
      </Form.Group>






        {/* ) : ( */}
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

        <Form>
          <Form.Group as={Row} className='mb-2'>
            <div style={{ display: 'flex' }}>
              <Form.Label>
                IP種類
              </Form.Label>
              <Button id="list-button">IP種類對照表</Button>
            </div>
            <Col>
              {grading.map((name, index) => (
                <Form.Check
                  key={index}
                  type="checkbox"
                  id={`category-${index}`}
                  label={name}
                  value={name}
                  onChange={handleCategoryChange}
                  checked={selectedCategories.includes(name)}
                />
              ))}
              <Form.Check
                type="checkbox"
                id="category-other"
                label="其他：自行創建"
                value="其他：自行創建"
                onChange={handleCategoryChange}
                checked={selectedCategories.includes('其他：自行創建')}
              />
            </Col>
          </Form.Group>

          {showDescription && (
            <Form.Group className='mb-4'>
              <Form.Label>IP名稱</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="請輸入IP名稱"
                  // value={newComic.description}
                  // onChange={(e) => setNewComic({ ...newComic, description: e.target.value })}
                />
              <Form.Label>IP敘述</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                placeholder="請描述IP的使用權限、範圍等"
                // value={newComic.description}
                // onChange={(e) => setNewComic({ ...newComic, description: e.target.value })}
              />
            </Form.Group>
          )}
        </Form>

        <Form.Group as={Row} className='mb-2'>
          <Form.Label>
          發行數量
          </Form.Label>
            <Form.Control
              type="number"
              placeholder="Min 1 Qty"
              step="1"
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

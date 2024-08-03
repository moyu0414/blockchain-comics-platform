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
  const [NFTData, setNFTData] = useState({price:'', description: '',quantity: '',royalty: '', comicHash:''});
  const [loading, setLoading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [showDescription, setShowDescription] = useState(false);
  const [inputValues, setInputValues] = useState({}); // 用于存储每个输入框的值
  let temp = [];
  const [grading, setGrading] = useState([
    "角色商品化",
    "改編權",
    "廣告宣傳",
    "專屬會員卡",
    "粉絲俱樂部徽章",
    "線上社區認證",
    "數位平台使用"
  ]);

  const defaultDescriptions = {
    "角色商品化": "授權方(本作者)允許被授權方(IP購買者)使用漫畫角色來製作周邊商品，如玩具、衣物或文具。",
    "改編權": "授權方(本作者)允許被授權方(IP購買者)改編漫畫內容為其他形式的作品，如電影、動畫或遊戲。",
    "廣告宣傳": "授權方(本作者)允許被授權方(IP購買者)在廣告和推廣材料中使用漫畫角色和元素。",
    "專屬會員卡": "授權方(本作者)允許被授權方(IP購買者)使用漫畫角色或標誌於會員卡上，作為粉絲會員身份的標識。",
    "粉絲俱樂部徽章": "授權方(本作者)允許被授權方(IP購買者)製作粉絲俱樂部的專屬徽章或紀念品。",
    "線上社區認證": "授權方(本作者)允許被授權方(IP購買者)線上社區或論壇的會員使用本漫畫的封面、標誌或形象作為認證圖標。",
    "數位平台使用": "授權方(本作者)允許被授權方(IP購買者)漫畫內容在數位平台上發布或銷售。",
    "其他：自行創建": ""
  };
  
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

  // 鑄造NFT函數
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
      if (price_temp < 10000000000000000 || NFTData.quantity <= 0 || NFTData.royalty < 1 || NFTData.royalty > 10) {
        alert('請填寫正確數量!');
        return;
      }

      disableButton();
      updateMessage("正在鑄造NFT中...請稍後。")

      console.log("price：" + NFTData.price);
      console.log("description：" + NFTData.description);
      console.log("royalty：" + NFTData.royalty);
      console.log("quantity：" + NFTData.quantity);
      console.log("comicHash：" + NFTData.comicHash);
     
      await contract.methods._mintNFT(price_temp, NFTData.description, NFTData.royalty, NFTData.quantity , NFTData.comicHash).send({ from: currentAccount });

      alert('鑄造NFT成功！');
      enableButton();
      updateMessage("");
      window.location.replace("/manageComic");
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
    const {price, description, quantity, royalty} = NFTData;
    // 檔案不可為空
    if (!price || !description || !quantity || !royalty) {
      updateMessage("請填寫所有欄位！");
      return -1;
    }
    return 0;
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
      let imgURL = "https://web3toonapi.ddns.net/api/comicIMG/" + temp[0].filename;
      let coverImg = '';
      if (temp[0].protoFilename) {
        coverImg = `https://web3toonapi.ddns.net/api/coverFile/${temp[0].filename}/${temp[0].protoFilename}`;
      }
      setNewComic({category:temp[0].category,  title: temp[0].title, description: temp[0].description, imgURL: imgURL, coverImg: coverImg});
      setNFTData({comicHash: temp[0].comicHash})
      setShowChapterForm(location.state.showChapterForm)
      connectToWeb3();
      setLoading(true);
    }
  }, [location]);

  useEffect(() => {
    const combinedDescription = selectedCategories
      .filter(category => category !== '其他：自行創建')
      .map(category => `${category}: ${inputValues[category] || ''}`)
      .join('\n');

    const otherDescription = showDescription
      ? `${inputValues['其他：IP名稱'] || ''}: ${inputValues['其他：IP敘述'] || ''}`
      : '';

    setNFTData(prevData => ({
      ...prevData,
      description: `${combinedDescription}\n${otherDescription}`
    }));
  }, [inputValues, selectedCategories, showDescription]);

  const handleCategoryChange = (e) => {
    const { value, checked } = e.target;
    setSelectedCategories(prevSelectedCategories => {
        if (checked) {
            // 如果勾选了该项，将其添加到 selectedCategories 中
            return [...prevSelectedCategories, value];
        } else {
            // 如果取消勾选，则从 selectedCategories 中移除该项
            return prevSelectedCategories.filter(category => category !== value);
        }
    });
    // 控制描述框的显示
    setShowDescription(value === '其他：自行創建' ? checked : showDescription);
    // 初始化或清除输入框的值
    if (value === '其他：自行創建' && checked) {
      setInputValues(prevValues => ({
          ...prevValues,
          [value]: defaultDescriptions[value]
      }));
    } else if (value !== '其他：自行創建') {
        setInputValues(prevValues => ({
            ...prevValues,
            [value]: defaultDescriptions[value]
        }));
    }
  };

  const handleInputChange = (e, category) => {
    const { value } = e.target;
    setInputValues(prevValues => ({...prevValues, [category]: value}));
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
            <div style={{ display: 'flex' }}>
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
        <Form.Group as={Row} className='mb-4'>
            <Form.Label>
                NFT價格
            </Form.Label>
            <Form.Control
                type="number"
                placeholder="Min 0.01 ETH"
                step="0.01"
                min="0.01"
                value={NFTData.price}
                onChange={(e) => setNFTData({ ...NFTData, price: e.target.value })}
            />
        </Form.Group>

        <Form>
            <Form.Group as={Row} className='mb-2'>
                <div style={{ display: 'flex' }}>
                    <Form.Label>
                        IP種類<br />(您選的第一個IP權將作為宣傳主類)
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

            {selectedCategories.map(category => (
                category !== '其他：自行創建' && (
                    <Form.Group className='mb-4' key={category}>
                        <Form.Label>{category} 權限範圍</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder={`请確認或修改 ${category} 權限範圍`}
                            value={inputValues[category] || ''}
                            onChange={(e) => handleInputChange(e, category)}
                        />
                    </Form.Group>
                )
            ))}

            {showDescription && (
                <Form.Group className='mb-4'>
                    <Form.Label>其他：IP名稱</Form.Label>
                    <Form.Control
                        type="text"
                        placeholder="請輸入IP名稱"
                        value={inputValues['其他：IP名稱'] || ''}
                        onChange={(e) => handleInputChange(e, '其他：IP名稱')}
                    />
                    <Form.Label>其他：IP敘述</Form.Label>
                    <Form.Control
                        type="text"
                        placeholder="請描述IP的使用權限、範圍等"
                        value={inputValues['其他：IP敘述'] || ''}
                        onChange={(e) => handleInputChange(e, '其他：IP敘述')}
                    />
                </Form.Group>
            )}
        </Form>

        <Form.Group as={Row} className='mt-4 mb-2'>
            <Form.Label>
                發行數量
            </Form.Label>
            <Form.Control
                type="number"
                placeholder="Min 1 Qty"
                step="1"
                min="1"
                value={NFTData.quantity}
                onChange={(e) => setNFTData({ ...NFTData, quantity: e.target.value })}
            />
        </Form.Group>

        <Form.Group as={Row} className='mt-4 mb-2'>
            <Form.Label>
                抽成比例(上限10%)，單位：％
            </Form.Label>
            <Form.Control
                type="number"
                placeholder="Min 1"
                step="1"
                min="1"
                max="10"
                value={NFTData.royalty}
                onChange={(e) => setNFTData({ ...NFTData, royalty: e.target.value })}
            />
        </Form.Group>
        <div className="text-red-500 text-center">{message}</div>
        <Button onClick={createNFT} id="list-button">確定鑄造</Button>

        {/* )} */}
    </div>
    
);

};

export default MintNFT;

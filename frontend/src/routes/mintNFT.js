import React, { useState, useEffect } from 'react';
import { Form, Row, Col, Button, ProgressBar } from 'react-bootstrap';
import { CardImage } from 'react-bootstrap-icons';
import { disableAllButtons, enableAllButtons } from '../index';
import Web3 from 'web3';
import comicData from '../contracts/ComicPlatform.json';
import $ from 'jquery';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import axios from 'axios';
const website = process.env.REACT_APP_Website;
const API_KEY = process.env.REACT_APP_API_KEY;

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
  const [NFTData, setNFTData] = useState({title: '', price:'', description: '',quantity: '',royalty: '', comicHash:''});
  const [descForK, setDescForK] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [showDescription, setShowDescription] = useState(false);
  const [inputValues, setInputValues] = useState({}); // 用于存储每个输入框的值
  const [isCheck, setIsCheck] = useState(false);
  const [nftFile, setNftFile] = useState([]);
  const [previewImageUrl, setPreviewImageUrl] = useState('');
  const { t } = useTranslation();
  const headers = {'api-key': API_KEY};
  const BATCH_SIZE = 10; // 每批处理的最大数量
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
    "角色商品化": t('角色商品化_描述'),
    "改編權": t('改編權_描述'),
    "廣告宣傳": t('廣告宣傳_描述'),
    "專屬會員卡": t('專屬會員卡_描述'),
    "粉絲俱樂部徽章": t('粉絲俱樂部徽章_描述'),
    "線上社區認證": t('線上社區認證_描述'),
    "數位平台使用": t('數位平台使用_描述'),
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
      } catch (error) {
        console.error(error);
      }
    } else {
      alert(t('請安裝MetaMask'));
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
        alert(t('請填寫正確數量'));
        return;
      }

      disableAllButtons();
      updateMessage(t('正在鑄造NFT中'))
      
      //console.log("title：" + NFTData.title);
      //console.log("price：" + NFTData.price);
      //console.log("description：" + NFTData.description);  // DB用
      //console.log("description：" + descForK.description);  // 合約用
      //console.log("royalty：" + NFTData.royalty);
      //console.log("quantity：" + NFTData.quantity);
      //console.log("comicHash：" + NFTData.comicHash);
     
      const transaction = await contract.methods._mintNFT(price_temp, descForK.description, NFTData.royalty, NFTData.quantity, NFTData.comicHash).send({ from: currentAccount });
      const transactionHash = transaction.transactionHash;
      //console.log(transactionHash);
      const receipt = await web3.eth.getTransactionReceipt(transactionHash);
      const tokenIds = [];
      for (let i = NFTData.quantity * 2 - 2; i >= 0; i -= 2) {
        const tokenId = web3.utils.hexToNumberString(receipt.logs[i].topics[3]);
        tokenIds.push(tokenId);
      }
      const { allSuccess, failedTokenIds } = await postNFTDataInBatches(tokenIds, {
        comicHash: NFTData.comicHash,
        minter: currentAccount,
        price: JSON.stringify({ "1": NFTData.price }),
        tokenTitle: NFTData.title,
        description: NFTData.description,
        forSale: 1,
        royalty: NFTData.royalty,
        owner: currentAccount
      });

      if (allSuccess) {
        alert(t('鑄造NFT成功'));
        updateMessage("");
        window.location.replace("/analysis");
      } else {
        alert(t('部分NFT鑄造失敗，請檢查控制台了解詳情'));
        console.log('Failed token IDs:', failedTokenIds);
      }
      enableAllButtons();
    } catch (error) {
      if (error.message.includes('User denied transaction signature')) {
        alert(t('拒绝交易'));
      } else {
        alert(t('鑄造NFT時發生錯誤') + error);
      }
      enableAllButtons();
      updateMessage("");
    }
  };

  async function postNFTDataInBatches(tokenIds, formData) {
    let allSuccess = true;
    const failedTokenIds = [];
    for (let i = 0; i < tokenIds.length; i += BATCH_SIZE) {
      const batch = tokenIds.slice(i, i + BATCH_SIZE);
      const batchFormData = new FormData();
      batch.forEach((tokenId) => {
        batchFormData.append('tokenId', tokenId);
      });
      batchFormData.append('comicHash', formData.comicHash);
      batchFormData.append('minter', formData.minter);
      batchFormData.append('price', formData.price);
      batchFormData.append('tokenTitle', formData.tokenTitle);
      batchFormData.append('description', formData.description);
      batchFormData.append('forSale', formData.forSale);
      batchFormData.append('royalty', formData.royalty);
      batchFormData.append('owner', formData.owner);
      if (nftFile.length != 0) {
        batchFormData.append('nftIMG', nftFile);
      }
      const result = await postNFTDataBatch(batchFormData);
      if (!result.success) {
        allSuccess = false;
        batch.forEach(tokenId => failedTokenIds.push(tokenId));
        console.error(`Failed batch with tokenIds: ${batch.join(', ')}`, result.error);
      }
    }
    return { allSuccess, failedTokenIds };
  }
  
  async function postNFTDataBatch(formData) {
    try {
      const response = await axios.post(`${website}/api/add/NFT`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'api-key': API_KEY
        }
      });
      //console.log(response.data);
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  }

  async function checkFile() {
    const {title, price, description, quantity, royalty} = NFTData;
    // 檔案不可為空
    if (title && title.length > 50) {
      alert(t('標題命名不可超過50個字!'));
      return -1;
    } else if (quantity > 50) {
      alert(t('發行數量一次最多50個!'));
      return -1;
    }  else if (royalty > 10) {
      alert(t('抽成比例最多10%!'));
      return -1;
    } else if (!title || !price || !description || !quantity || !royalty) {
      updateMessage(t('請填寫所有欄位'));
      return -1;
    }
    return 0;
  };

  useEffect(() => {
    const fetchData = async () => {
        if (!location.state) return;
        //console.log("Location state:", location.state);
        try {
            const storedArrayJSON = localStorage.getItem('comicDatas');
            const storedArray = JSON.parse(storedArrayJSON);
            const temp = storedArray.find(item => item.comicID === location.state.comicID);
            setComic([temp]);
            const [imageResponse, protoResponse] = await Promise.all([
                axios.get(`${website}/api/comicIMG/${temp.filename}`, { responseType: 'blob', headers }),
                temp.protoFilename ? axios.get(`${website}/api/coverFile/${temp.filename}/${temp.protoFilename}`, { responseType: 'blob', headers }) : Promise.resolve(null)
            ]);
            const imgURL = URL.createObjectURL(imageResponse.data);
            const coverImg = protoResponse ? URL.createObjectURL(protoResponse.data) : '';
            setNewComic({
                category: temp.category,
                title: temp.title,
                description: temp.description,
                imgURL: imgURL,
                coverImg: coverImg
            });
            setNFTData({ comicHash: temp.comic_id });
            setShowChapterForm(location.state.showChapterForm);
            connectToWeb3();
            setLoading(true);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };
    fetchData();
}, [location]);


  useEffect(() => {
    const combinedDescription = selectedCategories
      .filter(category => category !== t('其他：自行創建'))
      .map(category => `${category}: ${inputValues[category] || ''}`)
      .join('\n');

      const combinedDescriptionForK = selectedCategories
      .filter(category => category !== t('其他：自行創建'))
      .map(category => `${t(category)}: ${inputValues[category] || ''}`)
      .join('\n');
      
    const otherDescription = showDescription
      ? `${inputValues['其他：IP名稱'] || ''}: ${inputValues['其他：IP敘述'] || ''}`
      : '';

    setNFTData(prevData => ({
      ...prevData,
      description: `${combinedDescription}\n${otherDescription}`
    }));
    setDescForK(prevData => ({
      ...prevData,
      description: `${combinedDescriptionForK}\n${otherDescription}`
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
    setShowDescription(value === t('其他：自行創建') ? checked : showDescription);
    // 初始化或清除输入框的值
    if (value === t('其他：自行創建') && checked) {
      setInputValues(prevValues => ({
          ...prevValues,
          [value]: defaultDescriptions[value]
      }));
    } else if (value !== t('其他：自行創建')) {
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

  const handleCheckboxChange = (e) => {
    setIsCheck(e.target.checked);
  };

  const createPromoCover = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setPreviewImageUrl('');
      return;
    }
    if (validateFileType(file)) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImageUrl(reader.result);
      };
      reader.readAsDataURL(file);
      setNftFile(file);
    } else {
      alert(t('文件類型不支持，請上傳...格式的圖片'));
    }
  };

  const validateFileType = (file) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    return allowedTypes.includes(file.type);
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
                <div className="step-title">{t('漫畫資訊')}</div>
            </div>
            <div className={`step-item ${!showChapterForm && !stepCompleted ? 'step-item-gray' : ''}`}>
                <div className="step-line">
                    <div className={`line ${!showChapterForm && !stepCompleted ? 'bg-gray' : 'bg-blue'}`}></div>
                    <div className="dot">2</div>
                    <div className={`line ${!showChapterForm && !stepCompleted ? 'bg-gray' : 'bg-blue'}`}></div>
                </div>
                <div className="step-title">{t('鑄造NFT')}</div>
            </div>
        </div>
        {/* {loading ? ( */}

        <Form.Group as={Row} className='mb-1'>
            <div style={{ display: 'flex' }}>
                <Form.Label className='label-style col-form-label'>
                    {t('漫畫名稱')}
                </Form.Label>
                <Form.Control
                    type="text"
                    defaultValue={newComic.title}
                    style={{ marginLeft: '10px' }}
                    disabled={true}
                />
            </div>
        </Form.Group>

        <Form.Group as={Row} className='mb-3'>
            <div style={{ display: 'flex' }}>
                <Form.Label className='label-style mb-1 col-form-label'>
                    {t('漫畫類型')}
                </Form.Label>
                <Form.Control
                    className="form-select"
                    defaultValue={t(newComic.category)}
                    style={{ marginLeft: '10px' }}
                    disabled={true}
                />
            </div>
        </Form.Group>

        <Form.Group className='pb-3'>
            <div style={{ display: 'flex' }}>
                <Form.Label className='label-style col-form-label'>
                    {t('漫畫簡介')}
                </Form.Label>
                <Form.Control
                    as="textarea"
                    rows={5}
                    defaultValue={newComic.description}
                    style={{ marginLeft: '10px' }}
                    disabled={true}
                />
            </div>
        </Form.Group>

        <Form.Group className='pb-3'>
            <div style={{ display: 'flex' }}>
                <Form.Label className='label-style mb-1 col-form-label' htmlFor="image">
                    {t('漫畫封面')}
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
                <Form.Label className='label-style mb-1 col-form-label'>{t('漫畫橫向封面')}</Form.Label>
                {newComic.coverImg ? (
                    <img
                        src={newComic.coverImg}
                        alt="Preview"
                        style={{ width: '60%', maxWidth: '300px', paddingBottom: '3%', marginLeft: '10px' }}
                    />
                ) : (
                    <div>
                        <h3 style={{marginLeft: '10px'}}>{t('目前無上傳橫向封面')}</h3>
                        <br />
                    </div>
                )}
            </div>
        </Form.Group>

        {/* ) : ( */}
        <Form.Group as={Row} className='mb-3'>
            <Form.Label>
                NFT {t('名稱')}
            </Form.Label>
            <Form.Control
                type="text"
                placeholder={t('請輸入NFT標題名稱')}
                value={NFTData.title}
                onChange={(e) => setNFTData({ ...NFTData, title: e.target.value })}
            />
        </Form.Group>

        <Form.Group as={Row} className='mb-3'>
            <Form.Label>
                {t('NFT價格')}
            </Form.Label>
            <Form.Control
                type="number"
                placeholder={t('至少 0.01 ETH')}
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
                        {t('IP種類')}
                    </Form.Label>
                </div>

                <Col>
                    {grading.map((name, index) => (
                        <Form.Check
                            key={index}
                            type="checkbox"
                            id={`category-${index}`}
                            label={t(name)}
                            value={name}
                            onChange={handleCategoryChange}
                            checked={selectedCategories.includes(name)}
                        />
                    ))}
                    <Form.Check
                        type="checkbox"
                        id="category-other"
                        label={t('其他：自行創建')}
                        value={t('其他：自行創建')}
                        onChange={handleCategoryChange}
                        checked={selectedCategories.includes(t('其他：自行創建'))}
                    />
                </Col>
            </Form.Group>

            {selectedCategories.map(category => (
                category !== t('其他：自行創建') && (
                    <Form.Group className='mb-4' key={category}>
                        <Form.Label>{t(category)} {t('權限範圍')}</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder={t('请確認或修改...權限範圍', { category: t(category) })}
                            value={inputValues[category] || ''}
                            onChange={(e) => handleInputChange(e, category)}
                        />
                    </Form.Group>
                )
            ))}

            {showDescription && (
                <Form.Group className='mb-4'>
                    <Form.Label>{t('其他：IP名稱')}</Form.Label>
                    <Form.Control
                        type="text"
                        placeholder={t('請輸入IP名稱')}
                        value={inputValues['其他：IP名稱'] || ''}
                        onChange={(e) => handleInputChange(e, '其他：IP名稱')}
                    />
                    <Form.Label>{t('其他：IP敘述')}</Form.Label>
                    <Form.Control
                        type="text"
                        placeholder={t('請描述IP的使用權限、範圍等')}
                        value={inputValues['其他：IP敘述'] || ''}
                        onChange={(e) => handleInputChange(e, '其他：IP敘述')}
                    />
                </Form.Group>
            )}
        </Form>

        <Form.Group as={Row} className='mt-4 mb-2'>
            <Form.Label>
                {t('發行數量')}
            </Form.Label>
            <Form.Control
                type="number"
                placeholder={t('至少1個、至多50個')}
                step="1"
                min="1"
                max="50"
                value={NFTData.quantity}
                onChange={(e) => setNFTData({ ...NFTData, quantity: e.target.value })}
            />
        </Form.Group>

        <Form.Group as={Row} className='mt-4 mb-2'>
            <Form.Label title={t('第2次轉售時可抽成的比例')}>
                {t('抽成比例(上限10%)，單位：％')}
            </Form.Label>
            <Form.Control
                type="number"
                placeholder={t('至少1%，至多10%')}
                step="1"
                min="1"
                max="10"
                value={NFTData.royalty}
                onChange={(e) => setNFTData({ ...NFTData, royalty: e.target.value })}
                title={t('這是您的抽成比例，最多可設為 10%')}
            />
        </Form.Group>

        <Form.Group controlId="file-upload" className='pb-3'>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Form.Label className='col-form-label' title={t('上傳圖片作為NFT的封面')} style={{ marginRight: '1rem', whiteSpace: 'nowrap' }}>
              {t('NFT封面')}
            </Form.Label>
            <Form.Check
              type="checkbox"
              onChange={handleCheckboxChange}
              checked={isCheck}
              style={{ transform: 'scale(1.8)', marginRight: '1rem' }}
            />
            {isCheck && (
              <Form.Control
                type="file"
                name="fileUpload"
                accept="image/*"
                style={{ flex: 1, marginBottom: '0' }}
                onChange={createPromoCover}
              />
            )}
          </div>
          
          {isCheck && (
            <div className='file-upload mintNFT-img-height' style={{ display: 'flex', flexDirection: 'column', marginTop: '1rem' }}>
              <div id="start" style={{ display: 'block' }}>
                {previewImageUrl ? (
                  <img
                      src={previewImageUrl}
                      alt="Cover Preview"
                      style={{ height:'28vh' }}
                  />
                ) : (
                  <>
                    <CardImage size={48} />
                    <div id="notimage2" className="hidden">{t('上傳NFT橫向封面')}</div>
                  </>
                )}
              </div>
            </div>
          )}
        </Form.Group>

        <div className="text-red-500 text-center">{message}</div>
        <Button onClick={createNFT} id="list-button" data-backgroundcolor="#fff">{t('確定鑄造')}</Button>
        {/* )} */}
    </div>
    
);

};

export default MintNFT;

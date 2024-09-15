import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container,Form, Row, Col, Button, ProgressBar } from 'react-bootstrap';
import Web3 from 'web3';
import comicData from '../contracts/ComicPlatform.json';
import $ from 'jquery';
import { useLocation } from 'react-router-dom';
import { sortByTimestamp, disableAllButtons, enableAllButtons, getTranslationKey } from '../index';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import axios from 'axios';
import CryptoJS from 'crypto-js';
import { MdClose, MdDragHandle } from 'react-icons/md';  // 導入小叉叉圖標和拖曳圖標
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';  // 拖放功能，讓使用者可以拖曳圖片來重新排列它們的順序。
const website = process.env.REACT_APP_Website;
const API_KEY = process.env.REACT_APP_API_KEY;

const EditWork = (props) => {
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [message, updateMessage] = useState('');
  const [stepCompleted, setStepCompleted] = useState(false);
  const [showChapterForm, setShowChapterForm] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState(null);
  const [previewImageUrls, setPreviewImageUrls] = useState([]); // 多個圖片預覽
  const [comicHash, setComicHash] = useState('');
  const location = useLocation();
  const [file, setFiles] = useState('');
  const [chapterID, setChapterID] = useState('');
  const currentAccount = localStorage.getItem("currentAccount");
  const [comic, setComic] = useState([]);
  const [chapter, setChapter] = useState([]);  // 原始 chapter
  const [newComic, setNewComic] = useState({category:'',  title: '', description: '', imgURL: ''});
  const [newChapter, setNewChapter] = useState({chapterTitle: '', price: '', chapterHash: '', imgURL: '', isFree: false});
  const [coverFile, setCoverFile] = useState('');
  const [promoPreviewImageUrl, setPromoPreviewImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const language = localStorage.getItem('language') || i18n.language;
  const headers = {'api-key': API_KEY};
  const [grading, setGrading] = useState([
    "戀愛",
    "懸疑",
    "恐怖",
    "冒險",
    "古風",
    "玄幻",
    "武俠",
    "搞笑"
  ]);
  let tempCH = [];
  let chapterInfo = [];
  let mergedFile = '';
  
  // 連接到 Web3 的函數
  async function connectToWeb3(){
    if (window.ethereum) {
      try {
        const web3 = new Web3(window.ethereum);
        setWeb3(web3);
        const contractInstance = new web3.eth.Contract(comicData.abi, comicData.address);
        setContract(contractInstance);
        try {
          const response = await axios.get(`${website}/api/editWork/chapters`, {
              headers: headers,
              params: {
                comicHash: tempCH[0].comicHash,
                currentAccount: currentAccount
              }
          });
          let chapters = response.data;
          sortByTimestamp(chapters);
          //console.log(chapters);
          
          for (var i = 0; i < chapters.length; i++) {
              let id = 'Chapter' + (i+1);
              if (id == location.state.chapterID) {
                let price = chapters[i].price;
                const chapterResponse = await axios.get(`${website}/api/chapterIMG/${chapters[i].filename}`, { responseType: 'blob', headers });
                let imgURL = URL.createObjectURL(chapterResponse.data);
                setNewChapter({
                  chapterTitle: chapters[i].title,
                  price: price,
                  imgURL: imgURL
                });
                setChapter({
                  chapterTitle: chapters[i].title,
                  price: price,
                  chapterHash: chapters[i].chapterHash,
                  imgURL: imgURL,
                  filename: chapters[i].filename
                })
              }
          }
        } catch (error) {
            console.error('Error fetching records:', error);
        }
      } catch (error) {
        console.error(error);
      }
    } else {
      alert(t('請安裝MetaMask'));
    }
  };

  // 漫畫編輯函數
  const editComic = async (e) => {
    e.preventDefault();
    try {
      const fillFile = await checkFile();
      if(fillFile === -1){
        return;
      }
      disableAllButtons();
      updateMessage(t('正在編輯漫畫資料中'))
      
      if (comic[0].category === newComic.category &&
        comic[0].title === newComic.title &&
        comic[0].description === newComic.description &&
        !file && !coverFile
      ) {
        alert(t('目前您未編輯任何東西'));
        updateMessage("");
        enableAllButtons();
        return -1;
      }else if (comic[0].title != newComic.title) {  // 只變更title
        try {
          await contract.methods.editComic(comic[0].comic_id, newComic.title).send({ from: currentAccount });

          const formData = new FormData();
          formData.append('id', comic[0].comic_id);
          formData.append('title', newComic.title);
          formData.append('description', newComic.description);
          formData.append('category', newComic.category);
          formData.append('fileName', comic[0].filename);  // 原始圖檔名稱
          let editComicData;
          if (file) { // 有重新上傳圖片，重新產生新的fileName
            formData.append('comicIMG', file);  // 使用正确的字段名，这里是 'comicIMG'
            editComicData = {'comicHash': comic[0].comic_id, 'editTitle': newComic.title, 'editFile': comic[0].filename};
          } else {
            editComicData = {'comicHash': comic[0].comic_id, 'editTitle': newComic.title};
          }
          if (coverFile) {
            formData.append('coverFile', coverFile);
            const protoFilename = `promoCover.${getFileExtension(coverFile.name)}`;
            formData.append('protoFilename', protoFilename);
            //console.log(protoFilename);
          } else {
            formData.append('protoFilename', '');
          };
          await axios.put(`${website}/api/update/comicData`, formData, {headers});
  
          localStorage.setItem('editComicData', JSON.stringify(editComicData));
          window.location.replace("/editSuccess");
        } catch (error) {
          if (error.message.includes('User denied transaction signature')) {
            alert(t('拒绝交易'));
          } else {
            alert(error);
          }
          enableAllButtons();
          updateMessage("");
        }
      } else {
        //console.log(comic[0].comic_id);
        const formData = new FormData();
        formData.append('id', comic[0].comic_id);
        formData.append('title', newComic.title);
        formData.append('description', newComic.description);
        formData.append('category', newComic.category);
        formData.append('fileName', comic[0].filename);
        let editComicData;
        if (file) { // 有重新上傳圖片，重新產生新的fileName
          formData.append('comicIMG', file);  // 使用正确的字段名，这里是 'comicIMG'
          editComicData = {'comicHash': comic[0].comic_id, 'editTitle': newComic.title, 'editFile': comic[0].filename};
        } else {
          editComicData = {'comicHash': comic[0].comic_id, 'editTitle': newComic.title};
        }
        if (coverFile) {
          formData.append('coverFile', coverFile);
          const protoFilename = `promoCover.${getFileExtension(coverFile.name)}`;
          formData.append('protoFilename', protoFilename);
          //console.log(protoFilename);
        } else {
          formData.append('protoFilename', '');
        };
        await axios.put(`${website}/api/update/comicData`, formData, {headers});

        localStorage.setItem('editComicData', JSON.stringify(editComicData));
        window.location.replace("/editSuccess");
      };
    } catch (error) {
      alert(t('漫畫編輯時發生錯誤') + error);
      enableAllButtons();
      updateMessage("");
    }
  };


  // 章節編輯函數
  const editChapter = async (e) => {
    if (e) {
      e.preventDefault();
    }
    try {
      const fillFile = await checkFile();
      if(fillFile === -1){
        return;
      }
      let price_temp = newChapter.price;
      if (price_temp && !isNaN(parseFloat(price_temp))) {
        price_temp = parseFloat(price_temp);
        price_temp = web3.utils.toWei(price_temp.toString(), 'ether');
        if (price_temp < 10000000000000000 && newChapter.isFree === false) {
          alert(t('價格至少0.01 ETH'));
          return;
        }
      }
      disableAllButtons();
      updateMessage(t('正在編輯章節資料中'))

      if (chapter.price == newChapter.price && chapter.chapterTitle == newChapter.chapterTitle && file.length === 0) {
        alert(t('目前您未編輯任何東西'));
        updateMessage("");
        enableAllButtons();
        return -1;
      } else if (chapter.price != newChapter.price || chapter.chapterTitle != newChapter.chapterTitle) {  // 章節價格或標題有變動
        try {
          await contract.methods.editChapter(comic[0].comic_id, chapter.chapterHash, newChapter.chapterTitle, price_temp).send({ from: currentAccount });

          const formData = new FormData();
          formData.append('comic_id', comic[0].comic_id);
          formData.append('chapter_id', chapter.chapterHash);
          formData.append('price', newChapter.price);
          formData.append('title', newChapter.chapterTitle);
          formData.append('fileName', chapter.filename);
          if (file) {
            await handleGeneratePages();  // 等待合併圖片操作完成
            formData.append('chapterIMG', mergedFile);  // 使用正确的字段名，这里是 'chapterIMG'
          }
          await axios.put(`${website}/api/update/chapterData`, formData, {headers});

          let editComicData = {'comicHash': comic[0].comic_id, 'editTitle': comic[0].title, editChapter: newChapter.chapterTitle};
          localStorage.setItem('editComicData', JSON.stringify(editComicData));
          window.location.replace("/editSuccess");
        } catch (error) {
          if (error.message.includes('User denied transaction signature')) {
            alert(t('拒绝交易'));
          } else {
            alert(error);
          }
          enableAllButtons();
          updateMessage("");
        }
      }else {
        const formData = new FormData();
        formData.append('comic_id', comic[0].comic_id);
        formData.append('chapter_id', chapter.chapterHash);
        formData.append('price', newChapter.price);
        formData.append('title', newChapter.chapterTitle);
        formData.append('fileName', chapter.filename);
        if (file) {
          await handleGeneratePages();  // 等待合併圖片操作完成
          formData.append('chapterIMG', mergedFile);  // 使用正确的字段名，这里是 'chapterIMG'
        }
        await axios.put(`${website}/api/update/chapterData`, formData, {headers});

        let editComicData = {'comicHash': comic[0].comic_id, 'editTitle': comic[0].title, editChapter: newChapter.chapterTitle};
        localStorage.setItem('editComicData', JSON.stringify(editComicData));
        window.location.replace("/editSuccess");
      };
      //console.log("comicHash：" + comic[0].comic_id);
      //console.log("chapterTitle：" + newChapter.chapterTitle);
      //console.log("price：" + newChapter.price);
    } catch (error) {
      alert(t('章節編輯時發生錯誤') + error);
      enableAllButtons();
      updateMessage("");
    }
  };

  // 處理單張圖片，資料驗證、預覽
  const handleFileInputChange = (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }
    if (validateFileType(file)) {
      previewImage(file);
    } else {
      alert(t('文件類型不支持，請上傳...格式的圖片'));
      return -1;
    }
    setFiles(file);
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
  };

  // 處理多張圖片，資料驗證、預覽
  const handleMultiFileInputChange = (event) => {
    const files = event.target.files;
    const fileArray = Array.from(files);
    const urls = fileArray.map(file => URL.createObjectURL(file)); // 创建预览 URL
    fileArray.forEach(file => {
      if (validateFileType(file)) {
        previewImage(file);
      } else {
        alert(t('文件類型不支持，請上傳...格式的圖片'));
        return -1;
      }
    });
    setFiles(prevFiles => [...prevFiles, ...fileArray]);  // 添加新文件到旧文件列表中
    setPreviewImageUrls(prevUrls => [...prevUrls, ...urls]);  // 添加新预览 URL 到旧预览 URL 列表中
  };
  

  const createPromoCover = (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }
    if (validateFileType(file)) {
      previewPromoCover(file);
      setCoverFile(file);
    } else {
      alert(t('文件類型不支持，請上傳...格式的圖片'));
      return -1;
    }
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

  // 預覽圖片
  const previewPromoCover = (file) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      setPromoPreviewImageUrl(reader.result);
    };
  };

  // 处理单张图片的删除
  const handleRemoveCover = () => {
    setFiles(null);
    setPreviewImageUrl(null);
  };

  const handleRemovePromo = () => {
    setCoverFile(null);
    setPromoPreviewImageUrl(null);
  };

  // 允許使用者刪除不需要的文件預覽
  const handleRemoveFile = (index) => {
    const newFiles = [...file];
    const newUrls = [...previewImageUrls];
    newFiles.splice(index, 1);
    newUrls.splice(index, 1);
    setFiles(newFiles);
    setPreviewImageUrls(newUrls);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) {
      return;
    }
    const items = [...file];
    const urls = [...previewImageUrls];
    const [reorderedItem] = items.splice(result.source.index, 1);
    const [reorderedUrl] = urls.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    urls.splice(result.destination.index, 0, reorderedUrl);
    setFiles(items);
    setPreviewImageUrls(urls);
  };

  // 漫畫類型取值
  function ChoseLevel(e){
    let choseLevel = e.target.value;
    let rewind = getTranslationKey(choseLevel, language);
    setNewComic({ ...newComic, category: rewind })
  };

  async function checkFile() {
    if(showChapterForm == false){
      const {category, title, description} = newComic;
      // 檔案不可為空
      if( !category || !title || !description)  // || 其中一個為true，即為true
      {
        updateMessage(t('請填寫所有欄位'))
        return -1;
      }
    }else{
      const {chapterTitle, price} = newChapter;
      // 檔案不可為空
      if(!comicHash || !chapterTitle || (!newChapter.isFree && !price))
      {
        updateMessage(t('請填寫所有欄位'))
        return -1;
      }
    };
  };

  useEffect(() => {
    const fetchData = async () => {
        if (location.state) {
            //console.log("Location state:", location.state);
            setShowChapterForm(location.state.showChapterForm);
            const storedArrayJSON = localStorage.getItem('comicDatas');
            const storedArray = JSON.parse(storedArrayJSON);
            const temp = storedArray.filter(item => item.comicID === location.state.comicID);
            //console.log(temp);
            setComic(temp);
            tempCH.push({'comicHash': temp[0].comic_id})
            try {
                const [imageResponse, protoResponse] = await Promise.all([
                    axios.get(`${website}/api/comicIMG/${temp[0].filename}`, { responseType: 'blob', headers }),
                    temp[0].protoFilename ? axios.get(`${website}/api/coverFile/${temp[0].filename}/${temp[0].protoFilename}`, { responseType: 'blob', headers }) : Promise.resolve(null)
                ]);
                const imgURL = URL.createObjectURL(imageResponse.data);
                const coverImg = protoResponse ? URL.createObjectURL(protoResponse.data) : '';
                setNewComic({
                    category: temp[0].category,
                    title: temp[0].title,
                    description: temp[0].description,
                    imgURL: imgURL,
                    coverImg: coverImg
                });
                if (location.state.chapterID) {
                    setComicHash(temp[0].comic_id);
                    setChapterID(location.state.chapterID);
                }
                connectToWeb3();
                setLoading(true);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        }
    };
    fetchData();
}, [location.state, currentAccount]);

  // 处理生成合并图片并进行翻页
  const handleGeneratePages = async () => {
    return new Promise((resolve, reject) => {
      if (file.length == 1) {
        mergedFile = file[0];
        const reader = new FileReader();
        reader.readAsArrayBuffer(file[0]);
        resolve();
      } else {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = file.length * 1200; // 调整 canvas 的宽度和高度，根据需要
        canvas.height = 1600;
        // 遍历图片数组绘制到 canvas 上
        let xOffset = 0;
        const promises = file.map((file, index) => {
          return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
              ctx.drawImage(img, xOffset, 0, 1200, 1600);  // 绘制每张图片
              xOffset += 1200;  // 图片间距，根据实际需要调整
              resolve();
            };
            img.src = URL.createObjectURL(file); // 使用文件对象的 URL 绘制到 canvas
          });
        });
        Promise.all(promises).then(() => {
          // 导出合并后的图片
          canvas.toBlob((blob) => {
            const extension = getFileExtension(file[0].name); // 获取第一个文件的扩展名
            const fileName = `mergedImages_page.${extension}`;
            mergedFile = new File([blob], fileName, { type: 'image/jpeg' }); // 创建合并后的文件对象

            // 创建下载链接并触发下载
            //const downloadLink = document.createElement('a');
            //downloadLink.href = URL.createObjectURL(mergedFile);
            //downloadLink.download = fileName;
            //downloadLink.click();

            resolve(); // 完成 handleGeneratePages 的 Promise
          }, 'image/jpeg');
        });
      };
    });
  };

  // 获取文件扩展名的函数
  const getFileExtension = (filename) => {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
  };


  return (
    <>
      <div className="upload-form">
        <div className="step-container">
          <div className={`step-item ${stepCompleted && !showChapterForm ? 'step-completed' : ''}`}>
            <div className="step-line">
              <div className={`line ${stepCompleted ? 'bg-blue' : 'bg-gray'}`}></div>
              <div className="dot">1</div>
              <div className={`line ${stepCompleted ? 'bg-blue' : 'bg-gray'}`}></div>
            </div>
            <div className="step-title">{t('編輯漫畫')}</div>
          </div>
          <div className={`step-item ${!showChapterForm && !stepCompleted ? 'step-item-gray' : ''}`}>
            <div className="step-line">
              <div className={`line ${!showChapterForm && !stepCompleted ? 'bg-gray' : 'bg-blue'}`}></div>
              <div className="dot">2</div>
              <div className={`line ${!showChapterForm && !stepCompleted ? 'bg-gray' : 'bg-blue'}`}></div>
            </div>
            <div className="step-title">{t('編輯章節')}</div>
          </div>
        </div>
        {loading ? (
          <>
            {showChapterForm ? (
              <Form>
                <Form.Group as={Row} className='mb-3 label-container'>
                  <Form.Label column sm={3} className='label-style col-form-label label-section'>
                    {t('本章名稱')}
                  </Form.Label>
                  <Col sm={9}>
                    <Form.Control
                      type="text"
                      value={newChapter.chapterTitle}
                      placeholder={t('請輸入章節名稱')}
                      onChange={(e) => setNewChapter({ ...newChapter, chapterTitle: e.target.value })}
                    />
                  </Col>
                </Form.Group>
  
                <Form.Group as={Row} className='mb-3 label-container'>
                  <Form.Label column sm={3} className='label-style col-form-label label-section'>
                    {t('本章價格')}
                  </Form.Label>
                  <Col sm={9}>
                    <Form.Control
                      type="number"
                      value={newChapter.price == 0 ? '0' : newChapter.price}  // 如果 isFree 為 true，顯示 '0'，否則顯示 formParams_1.price
                      placeholder={t('至少 0.01 ETH')}
                      step="0.01"
                      disabled={newChapter.isFree}
                      onChange={(e) => setNewChapter({ ...newChapter, price: e.target.value })}
                    />
                  </Col>
                </Form.Group>
  
                <Form.Group as={Row} className='mb-3'>
                  <div style={{ display: 'flex' }}>
                    <Form.Label column sm={3} className='label-style  '>
                      {t('本章免費')}
                    </Form.Label>
                    <Form.Check
                      type="checkbox"
                      onChange={(e) => {
                        const isFree = e.target.checked;
                        setNewChapter({
                          ...newChapter,
                          isFree: isFree,
                          price: isFree ? 0 : newChapter.price // 如果是免费，则将价格设为 0，否则保持原来的价格
                        });
                      }}
                      checked={newChapter.isFree}
                      style={{ transform: 'scale(1.8)', marginTop: '12px', marginLeft: '1.3rem' }}
                    />
                  </div>
                </Form.Group>

                <Form.Group className='mb-4'>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Form.Label className='label-style mb-3 col-form-label'>
                      {t('本章作品上傳')}
                    </Form.Label>
                    <h6 style={{ marginLeft: '10px' }}>
                      {t('如不需變更內容，則無需上傳圖檔')}
                    </h6>
                  </div>
                  <Form.Control
                    type="file"
                    onChange={handleMultiFileInputChange}
                    multiple
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 45%', textAlign: 'left', marginRight: '10px' }}>
                      <div>{t('更改前的章節內容')}</div>
                      <br />
                      {newChapter.imgURL && (
                        <img
                          src={newChapter.imgURL}
                          alt="Preview"
                          style={{ width: '80%', paddingBottom: '3%' }}
                        />
                      )}
                    </div>
                    <div style={{ flex: '1 1 45%', textAlign: 'right' }}>
                      <div>{t('更改後的章節內容')}</div>
                      <br />
                      <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId="droppable">
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className="image-list"
                              style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'flex-end' }}
                            >
                              {previewImageUrls.map((url, index) => (
                                <Draggable key={index} draggableId={`draggable-${index}`} index={index}>
                                  {(provided) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className="image-item"
                                      style={{ position: 'relative' }}
                                    >
                                      <img
                                        src={url}
                                        alt={`Preview ${index}`}
                                        className="preview-image"
                                        style={{ width: '80%', height: 'auto', paddingBottom: '3%' }}
                                      />
                                      <button
                                        onClick={() => handleRemoveFile(index)}
                                        type="button"
                                        style={{ backgroundColor: 'white', position: 'absolute', top: '5px', right: '5px' }}
                                        className="remove-button"
                                      >
                                        <MdClose className="MdClose-button" />
                                      </button>
                                      <MdDragHandle
                                        style={{ position: 'absolute', bottom: '5px', right: '5px', cursor: 'grab' }}
                                      />
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </DragDropContext>
                    </div>
                  </div>
                </Form.Group>
  
                <div className="text-red-500 text-center">{message}</div>
                <Button onClick={editChapter} id="list-button" data-backgroundcolor="#fff">
                  {t('提交')}
                </Button>
              </Form>
            ) : (
              <Form>
                <Form.Group as={Row} className='mb-3 label-container'>
                  <Form.Label column sm={3} className='label-style label-section'>
                    {t('漫畫名稱')}
                  </Form.Label>
                  <Col sm={9}>
                    <Form.Control
                      type="text"
                      value={newComic.title}
                      onChange={(e) => setNewComic({ ...newComic, title: e.target.value })}
                    />
                  </Col>
                </Form.Group>
  
                <Form.Group as={Row} className='mb-3 label-container'>
                  <Form.Label column sm={3} className='label-style label-section'>
                    {t('漫畫類型')}
                  </Form.Label>
                  <Col sm={9}>
                    <Form.Control
                      as="select"
                      className="form-select"
                      value={t(newComic.category)}
                      onChange={ChoseLevel}
                    >
                      <option>{t('請選擇漫畫類型')}</option>
                      {grading.map((name, index) => (
                        <option key={index}>{t(name)}</option>
                      ))}
                    </Form.Control>
                  </Col>
                </Form.Group>
  
                <Form.Group className='pb-4'>
                  <Form.Label className='label-style mb-3 col-form-label'>{t('漫畫簡介')}</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={5}
                    value={newComic.description}
                    onChange={(e) => setNewComic({ ...newComic, description: e.target.value })}
                  />
                </Form.Group>
  
                <Form.Group className='pb-5'>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Form.Label className='label-style mb-1 col-form-label' htmlFor="image">
                      {t('漫畫封面')}
                    </Form.Label>
                    <h6 style={{ marginLeft: '10px' }}>
                      {t('如不需變更封面，則無需上傳圖檔')}
                    </h6>
                  </div>
                  <Form.Control
                    type="file"
                    onChange={handleFileInputChange}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 45%', marginRight: '20px', textAlign: 'left' }}>
                      <div>{t('更改前的圖片封面')}</div>
                      <br />
                      <img
                        src={newComic.imgURL}
                        alt="Preview"
                        style={{ width: '80%', maxWidth: '300px', paddingBottom: '3%' }}
                      />
                    </div>
                    <div style={{ flex: '1 1 45%', textAlign: 'right' }}>
                      <div>{t('更改後的圖片封面')}</div>
                      <br />
                      {previewImageUrl && (
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                          <img
                            src={previewImageUrl}
                            alt="Preview"
                            style={{ width: '80%', maxWidth: '300px', paddingBottom: '3%' }}
                          />
                          <button
                            onClick={handleRemoveCover}
                            type="button"
                            style={{ backgroundColor: 'white', position: 'absolute', top: '5px', right: '5px' }}
                            className="remove-button"
                          >
                            <MdClose className="MdClose-button" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </Form.Group>
  
                <Form.Group className='pb-5'>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Form.Label className='label-style mb-1 col-form-label' htmlFor="image">
                      {t('漫畫橫向封面')}
                    </Form.Label>
                    <h6 style={{ marginLeft: '10px' }}>
                      {t('如不需變更封面，則無需上傳圖檔')}
                    </h6>
                  </div>
                  <Form.Control
                    type="file"
                    onChange={createPromoCover}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 45%', marginRight: '20px', textAlign: 'left' }}>
                      <div>{t('更改前的橫向封面')}</div>
                      <br />
                      {newComic.coverImg ? (
                        <img
                          src={newComic.coverImg}
                          alt="Preview"
                          style={{ width: '80%', maxWidth: '300px', paddingBottom: '3%' }}
                        />
                      ) : (
                        <div>
                          <h3>{t('目前無上傳橫向封面')}</h3>
                          <br />
                        </div>
                      )}
                    </div>
                    <div style={{ flex: '1 1 45%', textAlign: 'right' }}>
                      <div>{t('更改後的橫向封面')}</div>
                      <br />
                      {promoPreviewImageUrl && (
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                          <img
                            src={promoPreviewImageUrl}
                            alt="Preview"
                            style={{ width: '80%', maxWidth: '300px', paddingBottom: '3%' }}
                          />
                          <button
                            onClick={handleRemovePromo}
                            type="button"
                            style={{ backgroundColor: 'white', position: 'absolute', top: '5px', right: '5px' }}
                            className="remove-button"
                          >
                            <MdClose className="MdClose-button" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </Form.Group>

                <div className="text-red-500 text-center">{message}</div>
                <Button onClick={editComic} id="list-button" data-backgroundcolor="#fff">
                  {t('提交')}
                </Button>
              </Form>
            )}
          </>
        ) : (
          <div className="loading-container">
            <div>{t('頁面加載中')}</div>
        </div>
        )}
      </div>
    </>
  );
  
};

export default EditWork;

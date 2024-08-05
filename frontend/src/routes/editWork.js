import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container,Form, Row, Col, Button, ProgressBar } from 'react-bootstrap';
import Web3 from 'web3';
import comicData from '../contracts/ComicPlatform.json';
import $ from 'jquery';
import { useLocation } from 'react-router-dom';
import { sortByTimestamp } from '../index';
import axios from 'axios';
import CryptoJS from 'crypto-js';
import { MdClose, MdDragHandle } from 'react-icons/md';  // 導入小叉叉圖標和拖曳圖標
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';  // 拖放功能，讓使用者可以拖曳圖片來重新排列它們的順序。
const website = process.env.REACT_APP_Website;

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
  const [newChapter, setNewChapter] = useState({chapterTitle: '', price: '', chapterHash: '', imgURL: ''});
  const [coverFile, setCoverFile] = useState('');
  const [promoPreviewImageUrl, setPromoPreviewImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
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
  let temp = [];
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
              params: {
              comicHash: temp[0].comicHash,
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
                let imgURL = `${website}/api/chapterIMG/${chapters[i].filename}`;
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
      alert('請安裝 MetaMask 或其他支援的錢包');
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
      disableButton();
      updateMessage("正在編輯漫畫資料中...請稍後。")
      
      if (comic[0].category === newComic.category &&
        comic[0].title === newComic.title &&
        comic[0].description === newComic.description &&
        !file && !coverFile
      ) {
        alert('目前您未編輯任何東西!');
        updateMessage("");
        enableButton();
        return -1;
      }else if (comic[0].title != newComic.title) {  // 只變更title
        try {
          await contract.methods.editComic(comic[0].comicHash, newComic.title).send({ from: currentAccount });

          const formData = new FormData();
          formData.append('id', comic[0].comicHash);
          formData.append('title', newComic.title);
          formData.append('description', newComic.description);
          formData.append('category', newComic.category);
          formData.append('fileName', comic[0].filename);  // 原始圖檔名稱
          let editComicData;
          if (file) { // 有重新上傳圖片，重新產生新的fileName
            formData.append('comicIMG', file);  // 使用正确的字段名，这里是 'comicIMG'
            editComicData = {'comicHash': comic[0].comicHash, 'editTitle': newComic.title, 'editFile': comic[0].filename};
          } else {
            editComicData = {'comicHash': comic[0].comicHash, 'editTitle': newComic.title};
          }
          if (coverFile) {
            formData.append('coverFile', coverFile);
            const protoFilename = `promoCover.${getFileExtension(coverFile.name)}`;
            formData.append('protoFilename', protoFilename);
            console.log(protoFilename);
          } else {
            formData.append('protoFilename', '');
          };
          await axios.put(`${website}/api/update/comicData`, formData);
  
          alert('漫畫編輯成功！');
          localStorage.setItem('editComicData', JSON.stringify(editComicData));
          window.location.replace("/editSuccess");
        } catch (error) {
          alert('漫畫編輯失敗!');
          enableButton();
          updateMessage("");
        }
      } else {
        console.log(comic[0].comicHash);
        const formData = new FormData();
        formData.append('id', comic[0].comicHash);
        formData.append('title', newComic.title);
        formData.append('description', newComic.description);
        formData.append('category', newComic.category);
        formData.append('fileName', comic[0].filename);
        let editComicData;
        if (file) { // 有重新上傳圖片，重新產生新的fileName
          formData.append('comicIMG', file);  // 使用正确的字段名，这里是 'comicIMG'
          editComicData = {'comicHash': comic[0].comicHash, 'editTitle': newComic.title, 'editFile': comic[0].filename};
        } else {
          editComicData = {'comicHash': comic[0].comicHash, 'editTitle': newComic.title};
        }
        if (coverFile) {
          formData.append('coverFile', coverFile);
          const protoFilename = `promoCover.${getFileExtension(coverFile.name)}`;
          formData.append('protoFilename', protoFilename);
          console.log(protoFilename);
        } else {
          formData.append('protoFilename', '');
        };
        await axios.put(`${website}/api/update/comicData`, formData);

        alert('漫畫編輯成功！');
        localStorage.setItem('editComicData', JSON.stringify(editComicData));
        window.location.replace("/editSuccess");
      };
    } catch (error) {
      console.error('漫畫編輯時發生錯誤：', error);
      alert('漫畫編輯時發生錯誤!');
      enableButton();
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
      if (newChapter.price < 0.01) {
        alert('價格至少0.01 ETH!');
        return;
      }
      disableButton();
      updateMessage("正在編輯章節資料中...請稍後。")

      if (chapter.price == newChapter.price && chapter.chapterTitle == newChapter.chapterTitle && file.length === 0) {
        alert('目前您未編輯任何東西!');
        updateMessage("");
        enableButton();
        return -1;
      } else if (chapter.price != newChapter.price || chapter.chapterTitle != newChapter.chapterTitle) {  // 章節價格或標題有變動
        try {
          let price_temp = parseFloat(newChapter.price);
          price_temp = web3.utils.toWei(price_temp, 'ether');
          await contract.methods.editChapter(comic[0].comicHash, chapter.chapterHash, newChapter.chapterTitle, price_temp).send({ from: currentAccount });

          const formData = new FormData();
          formData.append('comic_id', comic[0].comicHash);
          formData.append('chapter_id', chapter.chapterHash);
          formData.append('price', newChapter.price);
          formData.append('title', newChapter.chapterTitle);
          formData.append('fileName', chapter.filename);
          if (file) {
            await handleGeneratePages();  // 等待合併圖片操作完成
            formData.append('chapterIMG', mergedFile);  // 使用正确的字段名，这里是 'chapterIMG'
          }
          await axios.put(`${website}/api/update/chapterData`, formData);

          alert('章節編輯成功！');
          let editComicData = {'comicHash': comic[0].comicHash, 'editTitle': comic[0].title, editChapter: newChapter.chapterTitle};
          localStorage.setItem('editComicData', JSON.stringify(editComicData));
          window.location.replace("/editSuccess");
        } catch (error) {
          alert('章節編輯失敗!');
          enableButton();
          updateMessage("");
        }
      }else {
        const formData = new FormData();
        formData.append('comic_id', comic[0].comicHash);
        formData.append('chapter_id', chapter.chapterHash);
        formData.append('price', newChapter.price);
        formData.append('title', newChapter.chapterTitle);
        formData.append('fileName', chapter.filename);
        if (file) {
          await handleGeneratePages();  // 等待合併圖片操作完成
          formData.append('chapterIMG', mergedFile);  // 使用正确的字段名，这里是 'chapterIMG'
        }
        await axios.put(`${website}/api/update/chapterData`, formData);

        alert('章節編輯成功！');
        let editComicData = {'comicHash': comic[0].comicHash, 'editTitle': comic[0].title, editChapter: newChapter.chapterTitle};
        localStorage.setItem('editComicData', JSON.stringify(editComicData));
        window.location.replace("/editSuccess");
      };
      console.log("comicHash：" + comicHash);
      console.log("chapterTitle：" + newChapter.chapterTitle);
      console.log("price：" + newChapter.price);
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

  // 處理單張圖片，資料驗證、預覽
  const handleFileInputChange = (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }
    if (validateFileType(file)) {
      previewImage(file);
    } else {
      alert("文件類型不支持，請上傳JPG、JPEG 或 PNG 格式的圖片。");
      console.log("文件類型不支持，請上傳JPG、JPEG 或 PNG 格式的圖片。");
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
        alert("文件類型不支持，請上傳JPG、JPEG 或 PNG 格式的圖片。");
        console.log("文件類型不支持，請上傳JPG、JPEG 或 PNG 格式的圖片。");
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
      alert("文件類型不支持，請上傳JPG、JPEG 或 PNG 格式的圖片。");
      console.log("文件類型不支持，請上傳JPG、JPEG 或 PNG 格式的圖片。");
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
    setNewComic({ ...newComic, category: choseLevel })
  };

  async function checkFile() {
    if(showChapterForm == false){
      const {category, title, description} = newComic;
      // 檔案不可為空
      if( !category || !title || !description)  // || 其中一個為true，即為true
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
    // 检查是否传递了参数并设置 showChapterForm 状态
    if (location.state) {
      console.log("Location state:", location.state);
      setShowChapterForm(location.state.showChapterForm);
      const storedArrayJSON = localStorage.getItem('comicDatas');
      const storedArray = JSON.parse(storedArrayJSON);

      for (var i = 0; i < storedArray.length; i++) {
        if(storedArray[i].comicID == location.state.comicID){
          temp.push(storedArray[i]);
        };
      };
      //console.log(temp);
      setComic(temp);
      let imgURL = `${website}/api/comicIMG/${temp[0].filename}`;
      let coverImg = '';
      if (temp[0].protoFilename) {
        coverImg = `${website}/api/coverFile/${temp[0].filename}/${temp[0].protoFilename}`;
      }
      setNewComic({category:temp[0].category,  title: temp[0].title, description: temp[0].description, imgURL: imgURL, coverImg: coverImg});
    
      if (location.state.chapterID) {
        setComicHash(temp[0].comicHash);
        setChapterID(location.state.chapterID);
      };
      connectToWeb3();
      setLoading(true);
    }
  }, [currentAccount]);


  // 处理生成合并图片并进行翻页
  const handleGeneratePages = async () => {
    return new Promise((resolve, reject) => {
      if (file.length == 1) {
        console.log(file);
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
            <div className="step-title">編輯漫畫</div>
          </div>
          <div className={`step-item ${!showChapterForm && !stepCompleted ? 'step-item-gray' : ''}`}>
            <div className="step-line">
              <div className={`line ${!showChapterForm && !stepCompleted ? 'bg-gray' : 'bg-blue'}`}></div>
              <div className="dot">2</div>
              <div className={`line ${!showChapterForm && !stepCompleted ? 'bg-gray' : 'bg-blue'}`}></div>
            </div>
            <div className="step-title">編輯章節</div>
          </div>
        </div>
        {loading ? (
          <>
            {showChapterForm ? (
              <Form>
                <Form.Group as={Row} className='mb-3 label-container'>
                  <Form.Label column sm={3} className='label-style col-form-label label-section'>
                    本章名稱
                  </Form.Label>
                  <Col sm={9}>
                    <Form.Control
                      type="text"
                      value={newChapter.chapterTitle}
                      placeholder="請輸入章節名稱"
                      onChange={(e) => setNewChapter({ ...newChapter, chapterTitle: e.target.value })}
                    />
                  </Col>
                </Form.Group>
  
                <Form.Group as={Row} className='mb-3 label-container'>
                  <Form.Label column sm={3} className='label-style col-form-label label-section'>
                    本章價格
                  </Form.Label>
                  <Col sm={9}>
                    <Form.Control
                      type="number"
                      value={newChapter.price}
                      placeholder="Min 0.01 ETH"
                      step="0.01"
                      onChange={(e) => setNewChapter({ ...newChapter, price: e.target.value })}
                    />
                  </Col>
                </Form.Group>
  
                <Form.Group className='mb-4'>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Form.Label className='label-style mb-3 col-form-label'>
                      本章作品上傳
                    </Form.Label>
                    <h6 style={{ marginLeft: '10px' }}>
                      如不需變更內容，則無需上傳圖檔
                    </h6>
                  </div>
                  <Form.Control
                    type="file"
                    onChange={handleMultiFileInputChange}
                    multiple
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 45%', textAlign: 'left', marginRight: '10px' }}>
                      <div>更改前的章節內容</div>
                      <br />
                      {newChapter.imgURL ? (
                        <img
                          src={newChapter.imgURL}
                          alt="Preview"
                          style={{ width: '80%', paddingBottom: '3%' }}
                        />
                      ) : (
                        <p>目前無上傳章節內容</p>
                      )}
                    </div>
                    <div style={{ flex: '1 1 45%', textAlign: 'right' }}>
                      <div>更改後的章節內容</div>
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
                <Button onClick={editChapter} id="list-button">
                  提交
                </Button>
              </Form>
            ) : (
              <Form>
                <Form.Group as={Row} className='mb-3 label-container'>
                  <Form.Label column sm={3} className='label-style label-section'>
                    漫畫名稱
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
                    漫畫類別
                  </Form.Label>
                  <Col sm={9}>
                    <Form.Control
                      as="select"
                      className="form-select"
                      value={newComic.category}
                      onChange={ChoseLevel}
                    >
                      <option>請選擇漫畫類型</option>
                      {grading.map((name, index) => (
                        <option key={index}>{name}</option>
                      ))}
                    </Form.Control>
                  </Col>
                </Form.Group>
  
                <Form.Group className='pb-4'>
                  <Form.Label className='label-style mb-3 col-form-label'>漫畫簡介</Form.Label>
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
                      漫畫封面
                    </Form.Label>
                    <h6 style={{ marginLeft: '10px' }}>
                      如不需變更封面，則無需上傳圖檔
                    </h6>
                  </div>
                  <Form.Control
                    type="file"
                    onChange={handleFileInputChange}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 45%', marginRight: '20px', textAlign: 'left' }}>
                      <div>更改前的圖片封面</div>
                      <br />
                      <img
                        src={newComic.imgURL}
                        alt="Preview"
                        style={{ width: '80%', maxWidth: '300px', paddingBottom: '3%' }}
                      />
                    </div>
                    <div style={{ flex: '1 1 45%', textAlign: 'right' }}>
                      <div>更改後的圖片封面</div>
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
                      漫畫橫向封面
                    </Form.Label>
                    <h6 style={{ marginLeft: '10px' }}>
                      如不需變更封面，則無需上傳圖檔
                    </h6>
                  </div>
                  <Form.Control
                    type="file"
                    onChange={createPromoCover}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 45%', marginRight: '20px', textAlign: 'left' }}>
                      <div>更改前的橫向封面</div>
                      <br />
                      {newComic.coverImg ? (
                        <img
                          src={newComic.coverImg}
                          alt="Preview"
                          style={{ width: '80%', maxWidth: '300px', paddingBottom: '3%' }}
                        />
                      ) : (
                        <div>
                          <h3>目前無上傳橫向封面</h3>
                          <br />
                        </div>
                      )}
                    </div>
                    <div style={{ flex: '1 1 45%', textAlign: 'right' }}>
                      <div>更改後的橫向封面</div>
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
                <Button onClick={editComic} id="list-button">
                  提交
                </Button>
              </Form>
            )}
          </>
        ) : (
          <div>Loading...</div>
        )}
      </div>
    </>
  );
  
};

export default EditWork;

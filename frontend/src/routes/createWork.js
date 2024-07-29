import React, { useState, useEffect, useRef  } from 'react';
import { Link } from 'react-router-dom';
import { Form, Row, Col, Button, ProgressBar, Container } from 'react-bootstrap';
import Web3 from 'web3';
import { CardImage } from 'react-bootstrap-icons';
import comicData from '../contracts/ComicPlatform.json';
import $ from 'jquery';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import CryptoJS from 'crypto-js';
import { MdClose, MdDragHandle } from 'react-icons/md';  // 導入小叉叉圖標和拖曳圖標
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';  // 拖放功能，讓使用者可以拖曳圖片來重新排列它們的順序。

const CreateWork = (props) => {
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [formParams, updateFormParams] = useState({title:'', description:'',  category: ''});
  const [formParams_1, updateFormParams_1] = useState({title: '', price: ''});
  const [message, updateMessage] = useState('');
  const [stepCompleted, setStepCompleted] = useState(false);
  const [showChapterForm, setShowChapterForm] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState(null); // 單一圖片預覽
  const [previewImageUrls, setPreviewImageUrls] = useState([]); // 多個圖片預覽
  const [comicHash, setComicHash] = useState(''); // 儲存檔案哈希值的狀態
  const location = useLocation();
  const [hashValue, setHashValue] = useState('');
  const [file, setFiles] = useState([]);
  const [coverFile, setCoverFile] = useState([]);
  const [promoPreviewImageUrl, setPromoPreviewImageUrl] = useState('');
  const fileInputRef = useRef(null);
  const currentAccount = localStorage.getItem("currentAccount");
  let mergedFile = '';
  let chapterHash = '';
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

  // 連接到 Web3 的函數
  async function connectToWeb3(){
    if (window.ethereum) {
      try {
        // 請求用戶授權
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

  // 漫畫上傳函數
  const createComic = async (e) => {
    e.preventDefault();
    try {
      setComicHash(hashValue);
      const fillFile = await checkFile();
      if(fillFile === -1)
          return;
      if (!contract) {
        console.error('合約實例未初始化');
        return;
      }
      disableButton();
      updateMessage("正在上傳漫畫至合約中...請稍後。")

      console.log("comicHash：" + hashValue);
      console.log("title：" + formParams.title);
      console.log("author：" + currentAccount);
      console.log("description：" + formParams.description);
      console.log("level：" + formParams.category);
      //console.log(file);
      //console.log(coverFile);
     
      await contract.methods.uploadComic(hashValue, formParams.title).send({ from: currentAccount });

      const timestamp = Date.now();
      const formData = new FormData();
      formData.append('comicIMG', file); // 使用正确的字段名，这里是 'comicIMG'
      formData.append('creator', currentAccount);
      formData.append('title', formParams.title);
      formData.append('description', formParams.description);
      formData.append('category', formParams.category);
      formData.append('is_exist', 1);
      formData.append('comic_id', hashValue);
      formData.append('timestamp', timestamp);
      if (coverFile.length != 0) {
        formData.append('coverFile', coverFile);
        const protoFilename = "promoCover.jpg";
        formData.append('protoFilename', protoFilename);
      } else {
        formData.append('protoFilename', '');
      };

      try {
        const response = await axios.post('http://localhost:5000/api/add/comics', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        console.log('Comic added successfully:', response.data);

        alert('漫畫成功上傳！');
        enableButton();
        setShowChapterForm(true);
        updateMessage("");
        updateFormParams({category:'',  title: '', description: ''});
        setHashValue('');
        setFiles('');
      } catch (error) {
        console.error('Error adding comic:', error);
      }
    } catch (error) {
      console.error('上傳漫畫時發生錯誤：', error);
      alert('上傳漫畫時發生錯誤!' + error);
      enableButton();
      setShowChapterForm(false);
      updateMessage("");
    }
  };


  // 章節上傳函數
  const createChapter = async (e) => {
    if (e) {
      e.preventDefault();
    }
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

      await handleGeneratePages();  // 等待合併圖片操作完成
      await handleFileReaderLoad();  // 等待計算 chapterHash 值操作完成

      console.log("comicHash：" + comicHash);
      console.log("chapterHash：" + chapterHash);
      console.log("title：" + formParams_1.title);
      console.log("price：" + formParams_1.price);

      await contract.methods.addChapter(comicHash, chapterHash, formParams_1.title, price_temp).send({ from: currentAccount });

      const timestamp = Date.now();
      const formData = new FormData();
      formData.append('chapterIMG', mergedFile); // 使用正确的字段名，这里是 'chapterIMG'
      formData.append('comic_id', comicHash);
      formData.append('price', formParams_1.price);
      formData.append('title', formParams_1.title);
      formData.append('chapter_hash', chapterHash);
      formData.append('timestamp', timestamp);
      
      try {
        const response = await axios.post('http://localhost:5000/api/add/chapters', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        console.log('chapter added successfully:', response.data);

        alert('章節成功添加！');
        enableButton();
        updateMessage("");
        updateFormParams_1({title: '', price: ''});
        window.location.replace("/manageComic");
      } catch (error) {
        console.error('章節內容添加至資料庫時發生錯誤：', error);
      }
    } catch (error) {
      console.error('添加章節時發生錯誤：', error);
      alert('添加章節時發生錯誤!' + error);
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
    reader.onload = handleFileReaderLoad;
    reader.readAsArrayBuffer(file);
  };

  const handleButtonClick = () => {
    fileInputRef.current.click(); // 觸發檔案輸入框的點擊事件
  };

  // 處理多張圖片，資料驗證、預覽
  const handleMultiFileInputChange = (event) => {
    const files = event.target.files;
    const fileArray = Array.from(files);
    fileArray.forEach(file => {
      if (validateFileType(file)) {
        previewImage(file);
      } else {
        alert("文件類型不支持，請上傳JPG、JPEG 或 PNG 格式的圖片。");
        console.log("文件類型不支持，請上傳JPG、JPEG 或 PNG 格式的圖片。");
        return -1;
      }
    });
    const urls = fileArray.map(file => {
      return URL.createObjectURL(file);  // 创建预览 URL
    });
    setFiles(prevFiles => [...prevFiles, ...fileArray]);  // 添增新文件到舊文件列表中
    setPreviewImageUrls(prevUrls => [...prevUrls, ...urls]);  // 添加新預覽 URL 到舊預覽 URL 列表中
  };

  // 分別處理單張、多張圖片，計算 chapterHash
  const handleFileReaderLoad = async (event) => {
    let fileBuffer;
    if (event instanceof Event) {
      // 單張圖片處理
      fileBuffer = event.target.result;
    } else if (mergedFile instanceof File) {
      // 多張圖片處理
      fileBuffer = await mergedFile.arrayBuffer();
    } else {
      throw new Error('Unsupported event or mergedFile type');
    }
    const hash = CryptoJS.SHA256(CryptoJS.lib.WordArray.create(fileBuffer));
    const timestamp = Date.now().toString();
    const hashValue = hash.toString(CryptoJS.enc.Hex);
    const combinedValue = hashValue + timestamp;
    const finalValue = "0x" + combinedValue.slice(-64);
    if (event instanceof Event) {
      setHashValue(finalValue); // 單張圖片處理中設置最終的 hash 值
    } else {
      chapterHash = finalValue; // 多張圖片處理中設置最終的 hash 值
    }
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
  
  // 漫畫等級取值
  function ChoseLevel(e){
    let choseLevel = e.target.value;
    formParams.category = choseLevel;
  };

  // 檔案不可為空
  async function checkFile() {
    if(showChapterForm == false){
      const {category, title, description} = formParams;
      if( !category || !title || !description || file.length === 0)  // || 其中一個為true，即為true
      {
        updateMessage("請填寫所有欄位！")
        return -1;
      }
    }else{
      const {title, price} = formParams_1;
      if(!comicHash || !title || !price || file.length === 0)
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
      setShowChapterForm(true);
    }
  }, [location]);

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
        <Form>
          <Form.Group as={Row} className='mb-3 label-container'>
            <Form.Label column sm={3} className='label-style col-form-label label-section'>
                本章名稱
            </Form.Label>
            <Col sm={9}>
              <Form.Control
                type="text"
                value={formParams_1.title}
                placeholder="請輸入章節名稱"
                onChange={(e) => updateFormParams_1({ ...formParams_1, title: e.target.value })}
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
                value={formParams_1.price}
                placeholder="Min 0.01 ETH"
                step="0.01"
                onChange={(e) => updateFormParams_1({ ...formParams_1, price: e.target.value })}
              />
            </Col>
          </Form.Group>

          <Form.Group controlId="file-upload" className='pt-4'>
            <div style={{ display: 'flex' }}>
              <Form.Label
                className='label-style col-form-label'
                style={{ marginRight: '1rem', whiteSpace: 'nowrap' }}
              >
                本章作品上傳
              </Form.Label>
              <Form.Control
                type="file"
                onChange={handleMultiFileInputChange}
                multiple
                style={{ flex: 1 }} // 使文件输入框占据剩余空间
              />
            </div>
            <div className='file-upload-long' style={{ display: 'flex', flexDirection: 'column' }}>
                <div id="start" style={{ display: 'block' }}>
                  {previewImageUrls.length > 0 ? (
                      <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId="droppable">
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className="image-list"
                            >
                              {previewImageUrls.map((url, index) => (
                                <Draggable key={index} draggableId={`draggable-${index}`} index={index}>
                                  {(provided) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className="image-item"
                                    >
                                      <img
                                        src={url}
                                        alt={`Preview ${index}`}
                                        className="preview-image"
                                      />
                                      <Button
                                        onClick={() => handleRemoveFile(index)}
                                        className="remove-button"
                                        variant="light"
                                      >
                                        <MdClose className="MdClose-button" />
                                      </Button>
                                      <MdDragHandle style={{ position: 'absolute', bottom: '5px', right: '5px', cursor: 'grab' }} />
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </DragDropContext>
                  ) : (
                    <>
                      <CardImage size={48} />
                      <div id="notimage2" className="hidden">
                        上傳本章漫畫內容<br /><br />條漫：請上傳1整章圖檔<br />寬度：1200px、長度不限<br /><br />頁漫：請上傳多張圖檔<br />寬度：1200/張、長度：1600px
                      </div>
                    </>
                  )}

                </div>
            </div>
          </Form.Group>

          <div className="text-red-500 text-center">{message}</div>
          <Button onClick={createChapter} id="list-button">確認上傳</Button>
        </Form>
      </div>
    ) : (
      <div>
        <Form>
          <Form.Group as={Row} className='mb-3 label-container'>
              <Form.Label column sm={3} className='label-style label-section'>
                漫畫名稱
              </Form.Label>
              <Col sm={9}>
                <Form.Control
                  type="text"
                  value={formParams.title}
                  onChange={(e) => updateFormParams({ ...formParams, title: e.target.value })}
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
                onChange={ChoseLevel}
              >
                <option>請選擇漫畫類型</option>
                {grading.map((name, index) => (
                  <option key={index}>{name}</option>
                ))}
              </Form.Control>
            </Col>
          </Form.Group>

          <Form.Group>
            <Form.Label className='label-style mb-4 col-form-label'>漫畫簡介</Form.Label>
            <Form.Control
              as="textarea"
              rows={5}
              value={formParams.description}
              onChange={(e) => updateFormParams({ ...formParams, description: e.target.value })}
            />
          </Form.Group>

          <Form.Group controlId="file-upload" className='pt-4'>
          <div style={{ display: 'flex' }}>
            <Form.Label className='label-style col-form-label' style={{ marginRight: '1rem', whiteSpace: 'nowrap' }}>
              漫畫封面
            </Form.Label>
            <Form.Control
              type="file"
              name="fileUpload"
              accept="image/*"
              style={{ flex: 1 }}
              onChange={handleFileInputChange}
            />
          </div>
          <div className='file-upload' style={{ display: 'flex', flexDirection: 'column' }}>
              <div id="start" style={{ display: 'block' }}>
                {previewImageUrl ? (
                  <img
                    src={previewImageUrl}
                    alt="Preview"
                    style={{ width: '50%' }}
                  />
                ) : (
                  <>
                    <CardImage size={48} />
                    <div id="notimage" className="hidden">上傳漫畫封面</div>
                  </>
                )}
              </div>
          </div>
          </Form.Group>

          <Form.Group controlId="file-upload" className='pt-4 pb-3'>
          <div style={{ display: 'flex' }}>
            <Form.Label className='label-style col-form-label' style={{ marginRight: '1rem', whiteSpace: 'nowrap' }}>
              漫畫橫向封面
            </Form.Label>
            <Form.Control
              type="file"
              name="fileUpload"
              accept="image/*"
              style={{ flex: 1, marginBottom: '1rem' }}
              onChange={createPromoCover}
            />
          </div>
          <div className='file-upload' style={{ display: 'flex', flexDirection: 'column' }}>
              <div id="start" style={{ display: 'block' }}>
                {promoPreviewImageUrl ? (
                  <img
                    src={promoPreviewImageUrl}
                    alt="Promo Cover Preview"
                    style={{ height:'28vh', paddingBottom: '3%' }}
                  />
                ) : (
                  <>
                    <CardImage size={48} />
                    <div id="notimage2" className="hidden">上傳漫畫橫向封面</div>
                  </>
                )}
              </div>
          </div>
          </Form.Group>

          <div className="text-red-500 text-center">{message}</div>
          <Button onClick={createComic} id="list-button">確認上傳</Button>
        </Form>
      </div>
    )}
  </div>
);
};

export default CreateWork;

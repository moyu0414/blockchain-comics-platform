import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import comicData from '../contracts/ComicPlatform.json';
import Web3 from 'web3';
import { Link } from 'react-router-dom';
import { getIpfsHashFromBytes32, imageExists } from '../index';

const Reading = () => {
  const [comic, setComic] = useState([]);
  const [chapter, setChapter] = useState([]);
  const [url, setURL] = useState('');
  const { comicID, chapterID } = useParams();
  const [isZoomed, setIsZoomed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [being, setBeing] = useState(false);
  const [current, setCurrent] = useState([]);
  const [select, setSelect] = useState([]);
  let temp = [];
  let read = [];
  let now = [];
  let linkData = [];

  const fetchChapters = async () => {
    try {
      const storedArrayJSON = localStorage.getItem('comicDatas');
      const storedArray = JSON.parse(storedArrayJSON);
      
      for (var i = 0; i < storedArray.length; i++) {
        if(storedArray[i].comicID == comicID){
          temp.push(storedArray[i]);
        };
      };
      //console.log(temp);
      setComic(temp);

      const web3Instance = new Web3(window.ethereum);
      const contractInstance = new web3Instance.eth.Contract(comicData.abi, comicData.address);
      const accounts = await web3Instance.eth.getAccounts();
      let meta = await contractInstance.methods;
      const chapterInfo = await meta.getChapters(temp[0].hash).call();  //所有章節資料
      //console.log(chapterInfo);

      const chapterArrayJSON = localStorage.getItem('purchaseData');
      if (!chapterArrayJSON) {
        throw new Error('No purchase data found in localStorage');
      }
      const chapterArray = JSON.parse(chapterArrayJSON);
      if (!chapterArray || chapterArray.length === 0) {
        throw new Error('No chapters found in purchase data');
      }
      console.log(chapterArray);

      //判斷 comicID，並取出相應的購買紀錄，如果是作者也可閱讀
      let num = 1;
      for (var i = 0; i < chapterArray.length; i++) {
        if(chapterArray[i].comicID == comicID && chapterArray[i].buyer == accounts[0]){
          read.push({
            comicTitle: chapterArray[i].comicTitle,
            chapterTitle: chapterArray[i].title,
            chapterID: chapterArray[i].chapterID,
            chapterHash: chapterArray[i].chapterHash
          });
          num = num + 1;
        };
      };
      console.log(read);  //讀者部分

      for (var i = 0; i < chapterInfo[0].length; i++) {
        if(temp[0].author == accounts[0]){
          let id = 'Chapter' + num;
          read.push({
            comicTitle: temp[0].title,
            chapterTitle: chapterInfo[1][i],
            chapterID: id,
            chapterHash: chapterInfo[0][i]
          });
          num = num + 1;
        };
      };
      console.log(read);  //作者部分
      setChapter(read);
      

      for (var i = 0; i < read.length; i++) {
        if(read[i].chapterID == chapterID){
          let imgURL = '';
          let cid = await getIpfsHashFromBytes32(read[i].chapterHash);
          let IPFSurl = "https://apricot-certain-boar-955.mypinata.cloud/ipfs/" + cid + "?pinataGatewayToken=DlQddJX0ZBG74RznFKeBXWq0i24fOuD8ktnJMofUAYUuBlmhKKtKs01175WVvh5N";
          //let IPFSurl = "https://indigo-glad-rhinoceros-201.mypinata.cloud/ipfs/" + cid + '?pinataGatewayToken=';
          let IPFSurl_1 = "https://gateway.pinata.cloud/ipfs/" + cid + "?pinataGatewayToken=DlQddJX0ZBG74RznFKeBXWq0i24fOuD8ktnJMofUAYUuBlmhKKtKs01175WVvh5N";
          let temp_isBeing = [IPFSurl, IPFSurl_1];
          const results = await Promise.all(temp_isBeing.map(imageExists));
          results.forEach((exists, i) => {
            if (exists) {
              imgURL = temp_isBeing[i];
              setURL(temp_isBeing[i]);
            }
          });
          now.push({   //當前顯示頁面資料
            comicTitle: read[i].comicTitle,
            chapterTitle: read[i].chapterTitle,
            chapterID: read[i].chapterID,
            url: imgURL,
          })
        };
      };

      //章節上一章、下一章路徑
      let previous = '';
      let next = '';
      console.log(read.length);
      for (var i = 0; i < read.length; i++) {
        if(now[0].chapterID == read[i].chapterID){
          if (read.length == 1){
            previous = read[i].chapterID;
            next = read[i].chapterID;
          } else{
            if (i == 0){
              previous = read[i].chapterID;
              next = read[i+1].chapterID;
            } else if (i == read.length-1){
              previous = read[i-1].chapterID;
              next = read[i].chapterID;
            } else{
              previous = read[i-1].chapterID;
              next = read[i+1].chapterID;
            };
          };
          linkData.push({previous: previous, next: next, chapterTitle: now[0].chapterTitle});
        };
      };
      console.log(linkData);
      setSelect(linkData);
      console.log(now);
      setCurrent(now);
      setLoading(false);
      if (now.length < 1){
        setBeing(true);
      };
    } catch (error) {
      console.error('Error fetching chapters IPFS image:', error);
    }
  };

  useEffect(() => {
    fetchChapters();
  }, []);

  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
  };

  function reloadPage(){
    window.location.reload();
  };

  return (
    <div className="reading-page">
      <div className="reading-sidebar">
        {select.map((data, index) => (
          <div key={index} className="reading-sidebar-container">
            <h3>章節：{data.chapterTitle}</h3>
              <button onClick={reloadPage} style={{ marginRight: '15px' }}>
                <Link to={`/reading/${comicID}/${data.previous}`} style={{ textDecoration: 'none', color: 'inherit' }}> 
                  上一章
                </Link>
              </button>
              <button onClick={reloadPage} style={{ marginRight: '15px' }}>
                <Link to={`/reading/${comicID}/${data.next}`} style={{ textDecoration: 'none', color: 'inherit' }}> 
                  下一章
                </Link>            
              </button>
          </div>
        ))}
      </div>
      <div className="reading-content">
        {loading &&  
          <div className="loading-container">
            <div>漫畫加載中，請稍後...</div>
          </div>
        }
        {being &&  
          <div className="loading-container">
            <div>目前無購買漫畫，請重新刷新...</div>
          </div>
        }
        {current.map((chapter, index) => (
          <div key={index} className="chapter-container">
            <h3>漫畫：{chapter.comicTitle}</h3>
            <h3>章節：{chapter.chapterTitle}</h3>
            <img 
              src={chapter.url} 
              alt={chapter.chapterID} 
              className={`reading-image ${isZoomed ? 'zoomed' : ''}`} 
              onClick={toggleZoom}/>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Reading;

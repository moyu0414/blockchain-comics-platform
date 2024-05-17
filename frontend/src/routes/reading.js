import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import comicData from '../contracts/ComicPlatform.json';
import Web3 from 'web3';
import { Link } from 'react-router-dom';
import { getIpfsHashFromBytes32, imageExists } from '../index';

const Reading = () => {
  const [chapter, setChapter] = useState([]);
  const [url, setURL] = useState('');
  const { comicID, chapterID } = useParams();
  const [isZoomed, setIsZoomed] = useState(false);
  const [loading, setLoading] = useState(true);
  let read = [];

  const fetchChapters = async () => {
    try {
      const web3Instance = new Web3(window.ethereum);
      const accounts = await web3Instance.eth.getAccounts();


      const chapterArrayJSON = localStorage.getItem('purchaseData');
      if (!chapterArrayJSON) {
        throw new Error('No purchase data found in localStorage');
      }
      const chapterArray = JSON.parse(chapterArrayJSON);
      if (!chapterArray || chapterArray.length === 0) {
        throw new Error('No chapters found in purchase data');
      }
      console.log(chapterArray);

      //判斷 comicID 和 chapterID，並取出相應的購買紀錄，如果是作者也可閱讀
      for (var i = 0; i < chapterArray.length; i++) {
        if(chapterArray[i].comicID == comicID && chapterArray[i].chapterID == chapterID && chapterArray[i].buyer == accounts[0]){
          read.push(chapterArray[i]);
        } else if(chapterArray[i].comicID == comicID && chapterArray[i].chapterID == chapterID && chapterArray[i].author == accounts[0]){
          read.push(chapterArray[i]);
        };
      };
      setChapter(read);
      console.log(read);
      
      let cid = await getIpfsHashFromBytes32(read[0].chapterHash);
      let IPFSurl = "https://apricot-certain-boar-955.mypinata.cloud/ipfs/" + cid + "?pinataGatewayToken=DlQddJX0ZBG74RznFKeBXWq0i24fOuD8ktnJMofUAYUuBlmhKKtKs01175WVvh5N";
      //let IPFSurl = "https://indigo-glad-rhinoceros-201.mypinata.cloud/ipfs/" + cid + '?pinataGatewayToken=';
      let IPFSurl_1 = "https://gateway.pinata.cloud/ipfs/" + cid + "?pinataGatewayToken=DlQddJX0ZBG74RznFKeBXWq0i24fOuD8ktnJMofUAYUuBlmhKKtKs01175WVvh5N";
      let temp = [IPFSurl, IPFSurl_1];
      const results = await Promise.all(temp.map(imageExists));
      results.forEach((exists, i) => {
        if (exists) {
          setURL(temp[i]);
        }
      });
      setLoading(false);
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

  return (
    <div className="reading-page">
      <div className="reading-sidebar">
        {chapter.map((obj, index) => (
            <div key={index} className="reading-sidebar-container">
              <h3>章節：{obj.title}</h3>
              <button style={{ marginRight: '15px' }}>
                <Link to={`/reader_Chapter`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  上一章
                </Link>            
              </button>
              <button>
                <Link to={`/reader_Chapter`} style={{ textDecoration: 'none', color: 'inherit' }}>
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
        {Object.keys(chapter).map((key) => (
          <div key={key} className="chapter-container">
            <h3>漫畫：{chapter[key].comicTitle}</h3>
            <h3>章節：{chapter[key].title}</h3>
            <img 
              src={url} 
              alt={chapter[key].chapterID} 
              className={`reading-image ${isZoomed ? 'zoomed' : ''}`} 
              onClick={toggleZoom}/>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Reading;

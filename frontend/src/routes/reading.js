import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import comicData from '../contracts/ComicPlatform.json';
import Web3 from 'web3';
import { Link } from 'react-router-dom';
import { getIpfsHashFromBytes32, imageExists } from '../index';

const Reading = () => {
  const [chapter, setChapter] = useState([]);
  const [url, setURL] = useState('');
  const [isZoomed, setIsZoomed] = useState(false);

  const fetchChapters = async () => {
    try {
      const chapterArrayJSON = localStorage.getItem('purchaseData');
      if (!chapterArrayJSON) {
        throw new Error('No purchase data found in localStorage');
      }
      const chapter_temp = JSON.parse(chapterArrayJSON);
      if (!chapter_temp || chapter_temp.length === 0) {
        throw new Error('No chapters found in purchase data');
      }
      console.log(chapter_temp);
      console.log(chapter_temp[0].chapterHash);
      setChapter(chapter_temp);

      let cid = getIpfsHashFromBytes32(chapter_temp[0].chapterHash);
      let IPFSurl = "https://apricot-certain-boar-955.mypinata.cloud/ipfs/" + cid;
      let IPFSurl_1 = "https://gateway.pinata.cloud/ipfs/" + cid;
      let temp = [IPFSurl, IPFSurl_1];
      const results = await Promise.all(temp.map(imageExists));
      results.forEach((exists, i) => {
        if (exists) {
          setURL(temp[i]);
        }
      });
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
        {chapter.map((obj, index) => (
          <div key={index} className="chapter-container">
            <h3>漫畫：{obj.comicTitle}</h3>
            <h3>章節：{obj.title}</h3>
            <div className="image-container">
              <img 
                src={url} 
                alt={obj.chapterID} 
                className={`reading-image ${isZoomed ? 'zoomed' : ''}`} 
                onClick={toggleZoom} 
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Reading;

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import comicData from '../contracts/ComicPlatform.json';
import Web3 from 'web3';
import {getIpfsHashFromBytes32, imageExists} from '../index';

const Reading = () => {
  const [chapter, setChapter] = useState([]);
  const [url, setURL] = useState('');
  let temp = [];

  const fetchChapters = async () => {
    try {
      const chapterArrayJSON = localStorage.getItem('purchaseData');
      const chapter_temp = JSON.parse(chapterArrayJSON);
      console.log(chapter_temp);
      console.log(chapter_temp[0].chapterHash);
      setChapter(chapter_temp);


      let cid = getIpfsHashFromBytes32(chapter_temp[0].chapterHash);
      let IPFSurl = "https://apricot-certain-boar-955.mypinata.cloud/ipfs/" + cid;
      let IPFSurl_1 = "https://gateway.pinata.cloud/ipfs/" + cid;
      temp.push(IPFSurl);
      temp.push(IPFSurl_1);
      await Promise.all(temp.map(imageExists))
      .then(function(results) {
        for (var i = 0; i < results.length; i++) {
          if (temp[i].substr(8, 7) == 'apricot'){
            setURL(IPFSurl);
          }else{
            setURL(IPFSurl_1);
          }
        }
      });
    } catch (error) {
      console.error('Error fetching chapters IPFS image:', error);
    }
  };

  useEffect(() => {
    fetchChapters();
  }, []);

  return (
    <div className="select-chapter-page">
      <div className="page-content">
        <div className="chapter-selection">
          {chapter.map((obj, index) => (
            <div key={index}>
              <h3>漫畫：{obj.comicTitle}</h3>
              <h3>章節：{obj.title}</h3>
              <img src={url} alt={obj.chapterID} className="" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Reading;
import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import Web3 from 'web3';
import './bootstrap.min.css';
import './googleapis.css';

const Reader = () => {
  const [loading, setLoading] = useState(true);
  const [being, setBeing] = useState(false);
  const storedArrayJSON = localStorage.getItem('comicDatas');
  const [owner, setOwner] = useState([]);
  const currentAccount = localStorage.getItem("currentAccount");
  const uniqueData = [];
  const uniqueCheck = {};

  const initContract = async () => {
    try {
      const storedArrayJSON = localStorage.getItem('comicDatas');
      const storedArray = JSON.parse(storedArrayJSON);
      //console.log(storedArray)

      const chapterArrayJSON = localStorage.getItem('purchaseData');
      const chapterArray = JSON.parse(chapterArrayJSON);
      //console.log(chapterArray);

      const web3Instance = new Web3(window.ethereum);

      for (var i = 0; i < storedArray.length; i++) {
        for (var n = 0; n < chapterArray.length; n++) {
          if (storedArray[i].comicID == chapterArray[n].comicID && chapterArray[n].buyer == currentAccount){
            addData({ comicID: chapterArray[n].comicID, title: chapterArray[n].comicTitle, cid: storedArray[i].cid }); 
          }
        };
      };
      console.log(uniqueData);
      setOwner(uniqueData);
      setLoading(false);
      if (uniqueData.length < 1){
        setBeing(true);
      };
    } catch (error) {
      console.error('Error initializing contract:', error);
    }
  };

  useEffect(() => {
    initContract();
  }, []);

  // 添加新數據時進行唯一性檢查
  function addData(newItem) {
    const key = newItem.comicID;
    if (!uniqueCheck[key]) {
      uniqueData.push(newItem);
      uniqueCheck[key] = true;
    } 
  }

  
  return (
    <div className="container">
      <div>
        <h2 className='mt-5 title-text'>個人書櫃</h2>
      </div>

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

      <div className="row mt-5">
        {owner.map((comic, index) => (
            <div className="col-3 reader-container" key={index}>
              <Link to={`/reader_Chapter/${comic.comicID}`}> {/* 將 comicID 作為路由參數 */}
                <p className='management-title'>{comic.title}</p>
                <img src={comic.cid} alt={`Comic ${index + 1}`} className="img-fluid comic-image" />
              </Link>
            </div>
          ))}
      </div>
    </div>
  );
};


export default Reader;
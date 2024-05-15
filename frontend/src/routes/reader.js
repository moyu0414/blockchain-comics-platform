import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import Web3 from 'web3';
import comicData from '../contracts/ComicPlatform.json';
import './bootstrap.min.css';
import './googleapis.css';

const Reader = () => {
  const [showResults, setShowResults] = useState(false); // 新增狀態用來控制顯示搜索結果
  const [loading, setLoading] = useState(true);
  const [being, setBeing] = useState(false);
  const storedArrayJSON = localStorage.getItem('comicDatas');
  const [current, setCurrent] =  useState([]);
  const [owner, setOwner] = useState([]);
  let temp_myComics = [];

  const initContract = async () => {
    try {
      const storedArrayJSON = localStorage.getItem('comicDatas');
      const storedArray = JSON.parse(storedArrayJSON);
      setCurrent(storedArray);

      const web3Instance = new Web3(window.ethereum);
      const accounts = await web3Instance.eth.getAccounts();
      const contractInstance = new web3Instance.eth.Contract(comicData.abi, comicData.address);
      const meta = await contractInstance.methods;
      //console.log(meta);
      let myComics = await meta.getmycomics().call({from: accounts[0]}); // 所有已購買的漫畫
      //console.log(myComics);
      for (var i = 1; i < storedArray.length; i++) {
        for (var n = 0; n < myComics[0].length; n++) {
          if (storedArray[i].hash == myComics[0][n]){  //主要取得 comicID 
            temp_myComics.push({ comicID: storedArray[i].comicID, title: storedArray[i].title, cid: storedArray[i].cid }); 
          }
        };
      };
      setOwner(temp_myComics);
      console.log(temp_myComics);
      setLoading(false);
      if (temp_myComics.length < 1){
        setBeing(true);
      };
    } catch (error) {
      console.error('Error initializing contract:', error);
    }
  };

  useEffect(() => {
    initContract();
  }, []);

  
  return (
    <div className="container">
      <div>已購買的漫畫</div>

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
            <div className="col-3" key={index}>
              <Link to={`/reader_Chapter/${comic.comicID}`}> {/* 將 comicID 作為路由參數 */}
                <p>{comic.title}</p>
                <img src={comic.cid} alt={`Comic ${index + 1}`} className="img-fluid" />
              </Link>
            </div>
          ))}
      </div>
    </div>
  );
};


export default Reader;
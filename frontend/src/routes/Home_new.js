import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import { Link } from 'react-router-dom'; // 導入 Link 元件
import './bootstrap.min.css';
import './googleapis.css';
import createWork from '../contracts/CreateWork_New.json';
import {getIpfsHashFromBytes32} from '../index.js';
import cors from 'cors';

let meta = null;

const Home = ({contractAddress}) => {
  const [data, setData] = useState([]);
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false); // 新增狀態用來控制顯示搜索結果
  const search_parameters = Object.keys(Object.assign({}, ...data));
  const [account, setAccount] = useState('');
  const [comicHashArray, setComicHashArray] = useState([]);
  const [imgURL, setImgURL] = useState([]);
  const [loading, setLoading] = useState(true);

  const initContract = async () => {
    try {
      const web3 = new Web3(window.ethereum);
      const contractInstance = new web3.eth.Contract(createWork.abi, createWork.address);
      const meta = await contractInstance.methods;
      let allComicHashes = await meta.getAllComicHashes().call(); // 所有漫畫 Hash
      let comicHashes = [];
      for (var i = 0; i < allComicHashes.length; i++) {
        let ComicTitle = await meta.comics(allComicHashes[i]).call(); // 所有漫畫 Title
        //console.log(ComicTitle);
        let temp_title = ComicTitle[1];
        let temp_hash = allComicHashes[i];
        let temp_cid = getIpfsHashFromBytes32(allComicHashes[i]);
        let isBeing = "https://apricot-certain-boar-955.mypinata.cloud/ipfs/" + temp_cid;

        // 判斷漫畫網址是否存在
        imgURL.push(isBeing);
        setImgURL(imgURL);
        await Promise.all(imgURL.map(imageExists))
        .then(function(results) {
          if (results[i]) {
            console.log(results);
            comicHashes.push({ hash: temp_hash, cid: isBeing, title: temp_title }); // 將 hash 和對應的 cid 放入陣列中
          }
        });
      }
      setComicHashArray(comicHashes);
      setLoading(false);
    } catch (error) {
      console.error('Error initializing contract:', error);
    }
  };

  
  
  function imageExists(url) {
    return new Promise(function(resolve, reject) {
        fetch(url, { method: 'HEAD' })
            .then(function(response) {
                resolve(response.ok);
            })
            .catch(function() {
                resolve(false);
            });
    });
  };

  useEffect(() => {
    initContract();
  }, []);

  function search(data) {
    return data.filter((data) =>
      search_parameters.some((parameter) =>
        data[parameter].toString().toLowerCase().includes(query)
      )
    );
  }


  return (
    <div className="container">
      <div>
        <div className="input-box">
          <input
            type="search"
            name="search-form"
            id="search-form"
            className="search-input"
            onChange={(e) => {
              setQuery(e.target.value);
              setShowResults(e.target.value !== "");
            }}
            onFocus={() => setShowResults(query !== "")}
            onBlur={() => setShowResults(false)}
            placeholder="請輸入要尋找的字串"
          />
        </div>
  
        {showResults && (
          <div>
            {search(data).map((dataObj) => {
              return (
                <div className="box">
                  <div className="search-card">
                    <div className="category">{dataObj.topic} </div>
                    <div className="heading">
                      {dataObj.create}
                      <div className="author">{dataObj.options}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
  
        {loading &&  
          <div className="loading-container">
            <div>漫畫加載中，請稍後...</div>
          </div>}
  
        <div className="row mt-5">
          {comicHashArray.map((comic, index) => (
            <div className="col-3" key={index}>
              <Link to={`/selectChapter/${comic.hash}`}>
                <p>{comic.title}</p>
                <img src={comic.cid} alt={`Comic ${index + 1}`} className="img-fluid" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;

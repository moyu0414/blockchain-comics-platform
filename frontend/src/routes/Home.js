import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import { Link } from 'react-router-dom'; // 導入 Link 元件
import './bootstrap.min.css';
import './googleapis.css';
import {getIpfsHashFromBytes32} from '../index.js';

const Home = ({contractAddress}) => {
  const [data, setData] = useState([]);
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false); // 新增狀態用來控制顯示搜索結果
  const search_parameters = Object.keys(Object.assign({}, ...data));
  const [loading, setLoading] = useState(true);
  const storedArrayJSON = localStorage.getItem('comicDatas');
  const [current, setCurrent] =  useState([]);

  const initContract = async () => {
    try {
      const storedArray = JSON.parse(storedArrayJSON);
      console.log(storedArray);
      setCurrent(storedArray);
      setLoading(false);
    } catch (error) {
      console.error('Error initializing contract:', error);
    }
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
          {current.map((comic, index) => (
            <div className="col-3" key={index}>
              <Link to={`/selectChapter/${comic.comicID}`}>
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

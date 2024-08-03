import React, { useState, useEffect, useRef } from 'react';
import Web3 from 'web3';
import { Link } from 'react-router-dom'; // 導入 Link 元件
import './bootstrap.min.css';
import './googleapis.css';
import axios from 'axios';

const Home = ({ contractAddress }) => {
  const [data, setData] = useState([]);
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false); // 新增狀態用來控制顯示搜索結果
  const search_parameters = Object.keys(Object.assign({}, ...data));
  const [loading, setLoading] = useState(true);
  const storedArrayJSON = localStorage.getItem('comicDatas');
  const [current, setCurrent] = useState([]);
  const fetchedData = [];
  const searchRef = useRef();

  const initContract = async () => {
    try {
      const storedArray = JSON.parse(storedArrayJSON);
      console.log(storedArray);

      for (var i = 0; i < storedArray.length; i++) {
        if (storedArray[i].exists == 1) {
          fetchedData.push({ comicID: storedArray[i].comicID, title: storedArray[i].title, description: storedArray[i].description, author: storedArray[i].author, category: storedArray[i].category, filename: storedArray[i].filename});
        }
      };
      console.log(fetchedData);
      setCurrent(fetchedData);
      setData(fetchedData);
      setLoading(false);
    } catch (error) {
      console.error('Error initializing contract:', error);
    }
  };

  useEffect(() => {
    initContract();
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  function search(data) {
    return data.filter((data) =>
      search_parameters.some((parameter) =>
        data[parameter].toString().includes(query)
        //data[parameter].toString().toLowerCase().includes(query)
      )
    );
  };

  
  return (
    <div className="container" >
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
            placeholder="請輸入要尋找的字串、英文小寫"
          />
        </div>

        {showResults && (
          <div className='search-container' ref={searchRef}> 
            {search(data).map((dataObj, index) => {
              return (
                <div className="box" key={index}>
                  <div className="search-card">
                    <Link to={`/selectChapter/${dataObj.comicID}`}>
                      <div className="category">名稱：{dataObj.title} </div>
                      <div className="heading">
                        內容：{dataObj.description}
                        <div className="author">作者：{dataObj.author}</div>
                        <div className="author">類型：{dataObj.category}</div>
                      </div>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {loading &&
          <div className="loading-container">
            <div>漫畫加載中，請稍後...</div>
          </div>
        }

        <div className="row mt-5">
          {current.map((comic, index) => (
            <div className="col-3 comic-container mb-3" key={index}>
              <Link to={`/selectChapter/${comic.comicID}`}>
                <div className="comic-info-overlay">
                  <div className="comic-info">
                    <p>{comic.title}</p>
                    <p>
                      {comic.description.length > 50
                        ? `${comic.description.substring(0, 50)}...`
                        : comic.description}
                    </p>
                  </div>
                </div>
                <img src={`https://web3toonapi.ddns.net/api/comicIMG/${comic.filename}`} alt={`Comic ${index + 1}`} className="img-fluid comic-image" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;

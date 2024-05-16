import React, { useState, useEffect, useRef } from 'react';
import Web3 from 'web3';
import { Link } from 'react-router-dom'; // 導入 Link 元件
import comicData from '../contracts/ComicPlatform.json';
import './bootstrap.min.css';
import './googleapis.css';

const Home = ({ contractAddress }) => {
  const [data, setData] = useState([]);
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false); // 新增狀態用來控制顯示搜索結果
  const search_parameters = Object.keys(Object.assign({}, ...data));
  const [loading, setLoading] = useState(true);
  const storedArrayJSON = localStorage.getItem('comicDatas');
  const [current, setCurrent] = useState([]);
  const fetchedData = [];
  const grading = { "兒童漫畫": "1", "少年漫畫": "2", "少女漫畫": "3", "成人漫畫": "4" };
  const searchRef = useRef();

  const initContract = async () => {
    try {
      const storedArray = JSON.parse(storedArrayJSON);
      let nowAccount = storedArray.shift();
      console.log(storedArray);
      setCurrent(storedArray);
      setLoading(false);

      const web3Instance = new Web3(window.ethereum);
      const contractInstance = new web3Instance.eth.Contract(comicData.abi, comicData.address);
      let meta = await contractInstance.methods;


      for (var i = 0; i < storedArray.length; i++) {
        const comics = await meta.comics(storedArray[i].hash).call();
        let temp_level = findKeyByValue(grading, comics[4].toString());
        fetchedData.push({ comicID: storedArray[i].comicID, comicTitle: comics[1], comicDescription: comics[3], author: comics[2], level: temp_level });
      };
      setData(fetchedData);


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

  function findKeyByValue(obj, value) {
    return Object.keys(obj).find(key => obj[key] === value);
  };

  function search(data) {
    return data.filter((data) =>
      search_parameters.some((parameter) =>
        data[parameter].toString().toLowerCase().includes(query)
      )
    );
  };

  return (
    <div className="container" ref={searchRef}>
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
            placeholder="請輸入要尋找的字串"
          />
        </div>

        {showResults && (
          <div className='search-container'>
            {search(data).map((dataObj, index) => {
              return (
                <div className="box" key={index}>
                  <div className="search-card">
                    <Link to={`/selectChapter/${dataObj.comicID}`}>
                      <div className="category">名稱：{dataObj.comicTitle} </div>
                      <div className="heading">
                        內容：{dataObj.comicDescription}
                        <div className="author">作者：{dataObj.author}</div>
                        <div className="author">分級：{dataObj.level}</div>
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
            <div className="col-3 comic-container" key={index}>
              <Link to={`/selectChapter/${comic.comicID}`}>
                <div className="comic-info-overlay">
                  <div className="comic-info">
                    <p>{comic.title}</p>
                    <p className="comic-description">{comic.description}</p>
                  </div>
                </div>
                <img src={comic.cid} alt={`Comic ${index + 1}`} className="img-fluid comic-image" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;

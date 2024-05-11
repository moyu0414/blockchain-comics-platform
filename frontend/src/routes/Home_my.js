import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import { Link } from 'react-router-dom'; // 導入 Link 元件
import './bootstrap.min.css';
import './googleapis.css';
import createWork from '../contracts/CreateWork_New.json';
import axios from 'axios';
import {getIpfsHashFromBytes32} from '../index.js';

let meta = null;

const Home = ({contractAddress}) => {
  const [data, setData] = useState([]);
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false); // 新增狀態用來控制顯示搜索結果
  const search_parameters = Object.keys(Object.assign({}, ...data));
  const [account, setAccount] = useState('');
  const [img, setImg] = useState('');
  const [comicImg, setComicImg] = useState({'': ''});
  const [comicHashArray, setComicHashArray] = useState([]);

  const initContract = async () => {
    try {
      const web3 = new Web3(window.ethereum);
      const contractInstance = new web3.eth.Contract(createWork.abi, createWork.address);
      const meta = await contractInstance.methods;
      let allComicHashes = await meta.getAllComicHashes().call();
      let comicHashes = [];
      for (var i = 0; i < allComicHashes.length; i++) {
        let temp_hash = allComicHashes[i];
        console.log(temp_hash);
        let temp_cid = getIpfsHashFromBytes32(allComicHashes[i]);
        let isBeing = "https://gateway.pinata.cloud/ipfs/" + temp_cid;
        comicHashes.push({ hash: temp_hash, cid: isBeing }); // 將 hash 和對應的 cid 放入陣列中
      }
      setComicHashArray(comicHashes);
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
      <div className="input-box">
        <input
          type="search"
          name="search-form"
          id="search-form"
          className="search-input"
          onChange={(e) => {
            setQuery(e.target.value);
            setShowResults(e.target.value !== ""); // 如果輸入框中有值，則顯示結果，否則隱藏
          }}
          onFocus={() => setShowResults(query !== "")} // 當搜尋框得到焦點並且有值時顯示結果
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


      <div className="row mt-5">

        {comicHashArray.map((comic, index) => (
          <div className="col-3" key={index}>
            <Link to={`/selectChapter/${comic.hash}`}> {/* 將 hash 作為路由參數 */}
              <img src={comic.cid} alt={`Comic ${index + 1}`} className="img-fluid" />
            </Link>
          </div>
        ))}
        
        {/* {comicHashArray.map((comic, index) => (
          <div className="col-3" key={index}>
            <Link
              to={{
                pathname: "/selectChapter",
                state: { hash: comic.hash } 
              }}
            >
              <img src={comic.cid} alt={`Comic ${index + 1}`} className="img-fluid" />
            </Link>
          </div>
        ))} */}

        {/* <div className="col-3">
        <Link to="/selectChapter">
            <img src={img} alt="Comic 1" className="img-fluid" />
          </Link> 
        </div>
        
        <div className="col-3">
          <Link to="/comic2">
            <img src={img} alt="Comic 2" className="img-fluid" />
          </Link>
        </div>

        <div className="col-3">
          <Link to="/comic3">
            <img src={img} alt="Comic 3" className="img-fluid" />
          </Link>
        </div>

        <div className="col-3">
          <Link to="/comic4">
            <img src={img} alt="Comic 4" className="img-fluid" />
          </Link>
        </div> */}


      </div>

      {/* <div className="row mt-5 mb-5">
        <div className="col-3">
        <Link to="/comic1">
            <img src={require("../image/comic5.png")} alt="Comic 1" className="img-fluid" />
          </Link> 
        </div>
        <div className="col-3">
          <Link to="/comic2">
            <img src={require("../image/comic6.png")} alt="Comic 2" className="img-fluid" />
          </Link>
        </div>
        <div className="col-3">
          <Link to="/comic3">
            <img src={require("../image/comic7.png")} alt="Comic 3" className="img-fluid" />
          </Link>
        </div>
        <div className="col-3">
          <Link to="/comic4">
            <img src={require("../image/comic8.png")} alt="Comic 4" className="img-fluid" />
          </Link>
        </div>
      </div> */}
    </div>
  );
};

export default Home;

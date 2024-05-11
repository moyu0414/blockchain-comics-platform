import Web3 from 'web3';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import createWork from '../contracts/CreateWork_New.json';
import {getIpfsHashFromBytes32} from '../index.js';
import $ from 'jquery';


const CreatorPage = () => {
  const [account, setAccount] = useState('');
  const [comicHashArray, setComicHashArray] = useState([]);
  const [imgURL, setImgURL] = useState([]);

  const initContract = async () => {
    try {
      const web3 = new Web3(window.ethereum);
      const contractInstance = new web3.eth.Contract(createWork.abi, createWork.address);
      const accounts = await web3.eth.getAccounts();
      setAccount(accounts[0]);
      const meta = await contractInstance.methods;
      let allComicHashes = await meta.getAllComicHashes().call();  // 找出此帳戶所有創作的漫畫
      let comicHashes = [];
      
      for (var i = 0; i < allComicHashes.length; i++) {
        let comics = await meta.comics(allComicHashes[i]).call();
        let temp_title = comics[1];
        let comics_author = comics[2];
        
        if (comics_author == account){
          let temp_hash = allComicHashes[i];
          let temp_cid = getIpfsHashFromBytes32(allComicHashes[i]);
          //console.log(temp_cid);
          let isBeing = "https://apricot-certain-boar-955.mypinata.cloud/ipfs/" + temp_cid;

          // 判斷漫畫網址是否存在
          imgURL.push(isBeing);
          setImgURL(imgURL);
          await Promise.all(imgURL.map(imageExists))
          .then(function(results) {
            if (results) {
              comicHashes.push({ hash: temp_hash, cid: isBeing, title: temp_title }); // 將 hash 和對應的 cid 放入陣列中
            }
          });
        };
      };
      setComicHashArray(comicHashes);
      console.log(comicHashes);
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

  return (
    <div className="container">
      <div className="d-flex justify-content-end mt-3">
      <Button variant="primary">
        <Link to="/createWork" style={{ textDecoration: 'none', color: 'inherit' }}>
          上傳作品
        </Link>
      </Button>
      </div>

      <div className="row mt-5">
        {comicHashArray.map((comic, index) => (
            <div className="col-3" key={index}>
              <Link to={`/selectChapter/${comic.hash}`}> {/* 將 hash 作為路由參數 */}
                <p>{comic.title}</p>
                <img src={comic.cid} alt={`Comic ${index + 1}`} className="img-fluid" />
              </Link>
            </div>
          ))}
      </div>

    </div>
  );
};

export default CreatorPage;

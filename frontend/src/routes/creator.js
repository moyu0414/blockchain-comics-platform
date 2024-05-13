import Web3 from 'web3';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import createWork from '../contracts/ComicPlatform.json';
import $ from 'jquery';


const CreatorPage = () => {
  const [imgURL, setImgURL] = useState([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] =  useState([]);
  const [owner, setOwner] = useState([]);
  let temp = [];

  const initContract = async () => {
    try {
      const storedArrayJSON = localStorage.getItem('comicDatas');

      const storedArray = JSON.parse(storedArrayJSON);
      setCurrent(storedArray);

      for (var i = 0; i < storedArray.length; i++) {
        if (storedArray[0].nowAccount == storedArray[i].author){
          temp.push(storedArray[i]);
        }
      };
      console.log(temp);
      setOwner(temp);
      setLoading(false);

    } catch (error) {
      console.error('Error initializing contract:', error);
    }
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

      <div>作品已上鏈</div>

      {loading &&  
        <div className="loading-container">
          <div>漫畫加載中，請稍後...</div>
        </div>
      }

      <div className="row mt-5">
        {owner.map((comic, index) => (
            <div className="col-3" key={index}>
              <Link to={`/selectChapter/${comic.comicID}`}> {/* 將 comicID 作為路由參數 */}
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

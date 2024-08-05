import Web3 from 'web3';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import $ from 'jquery';
const website = process.env.REACT_APP_Website;

const Creator = () => {
  const [imgURL, setImgURL] = useState([]);
  const [loading, setLoading] = useState(true);
  const [being, setBeing] = useState(false);
  const [current, setCurrent] =  useState([]);
  const [owner, setOwner] = useState([]);
  const currentAccount = localStorage.getItem("currentAccount");
  let temp = [];

  const initContract = async () => {
    try {
      const storedArrayJSON = localStorage.getItem('comicDatas');
      const storedArray = JSON.parse(storedArrayJSON);
      setCurrent(storedArray);

      for (var i = 0; i < storedArray.length; i++) {
        if (storedArray[i].author == currentAccount){
          temp.push(storedArray[i]);
        }
      };
      console.log(temp);
      setOwner(temp);
      setLoading(false);

      if (temp.length < 1){
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
      <div>
        <h2 className='mt-5 title-text'>作品管理</h2>
      </div>
      <div className="d-flex justify-content-end mt-3">
      <Button className='btn'>
        <Link to="/createWork" style={{ textDecoration: 'none', color: 'inherit' }}>
          上傳作品
        </Link>
      </Button>
      </div>

      {loading &&  
        <div className="loading-container">
          <div>漫畫加載中，請稍後...</div>
        </div>
      }
      {being &&  
        <div className="loading-container">
          <div>目前鏈上無漫畫，請重新刷新...</div>
        </div>
      }

      <div className="row mt-5">
        {owner.map((comic, index) => (
            <div className="col-3" key={index}>
              <Link to={`/chapterManagement/${comic.comicID}`}> {/* 將 comicID 作為路由參數 */}
                <p className='management-title'>{comic.title}</p>
                <img src={`${website}/api/comicIMG/${comic.filename}`} alt={`Comic ${index + 1}`} className="img-fluid" />
              </Link>
            </div>
          ))}
      </div>

    </div>
  );
};

export default Creator;

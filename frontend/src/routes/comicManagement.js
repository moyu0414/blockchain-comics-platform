import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import comicData from '../contracts/ComicPlatform.json';

const ComicManagement = ({ contractAddress }) => {
  const [data, setData] = useState([]);
  const storedArrayJSON = localStorage.getItem('comicDatas');
  const [current, setCurrent] = useState([]);

  useEffect(() => {
    if (storedArrayJSON) {
      const storedArray = JSON.parse(storedArrayJSON);
      console.log('Stored Comics Array:', storedArray);
      setCurrent(storedArray);
    }
  }, [storedArrayJSON]);

  return (
    <div className="management-page">
      <h2 className="title-text">管理者_漫畫管理</h2>
      <div className="page-content">
        <div className="chapter-selection">
          <table className="table table-image">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">漫畫標題</th>
                <th scope="col">作者</th>
                <th scope="col"></th>
              </tr>
            </thead>
            <tbody>
              {current.map((comic, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td className='chapter-title'>{comic.title}</td>
                  <td>{comic.author}</td>
                  {/* <td>
                    <button onClick={() => handlePurchase(index)} className="btn" value={chapter.isBuying}>{chapter.isBuying}</button>
                  </td> */}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ComicManagement;

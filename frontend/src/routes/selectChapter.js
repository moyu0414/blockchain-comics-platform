import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import comicData from '../contracts/ComicPlatform.json';
import Web3 from 'web3';


const SelectChapter = () => {
  const [chapters, setChapters] = useState([]);
  const { comicID } = useParams();
  const [current, setCurrent] =  useState([]);
  const [meta, setMeta] = useState('');
  let temp = [];

  const fetchChapters = async () => {
    try {
      const storedArrayJSON = localStorage.getItem('comicDatas');
      const storedArray = JSON.parse(storedArrayJSON);
      console.log(storedArray);
      
      for (var i = 0; i < storedArray.length; i++) {
        if(storedArray[i].comicID == comicID){
          temp.push(storedArray[i]);
        };
      };
      console.log(temp);
      console.log(temp[0].hash);

      const web3Instance = new Web3(window.ethereum);
      const contractInstance = new web3Instance.eth.Contract(comicData.abi, comicData.address);
      let meta = await contractInstance.methods;
      //console.log(contractInstance);
      console.log(meta);
      setMeta(meta);
      

      const chapterInfo = await meta.getChapters(temp[0].hash).call(); // 所有漫畫 Hash
      console.log('Chapter raw info:', chapterInfo);
      let temp_chapter = {
        title: chapterInfo[1],
        price: chapterInfo[2]
      };
      console.log(temp_chapter);
      setChapters(temp_chapter);

      


    } catch (error) {
      console.error('Error fetching chapters:', error);
    }
  };

  useEffect(() => {
    fetchChapters();
  }, []);


  const handlePurchase = (chapterId) => {
    console.log(`Purchased chapter with ID: ${chapterId}`);
  };

  return (
    <div className="select-chapter-page">
      <div className="page-content">
        <h1>章節選擇</h1>
        <div className="chapter-selection">
          <table className="table table-image">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">本集標題</th>
                <th scope="col">價格</th>
                <th scope="col">操作</th>
              </tr>
            </thead>
            <tbody>
              {chapters.map((chapter, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td className='chapter-title'>{chapter.title}</td>
                  <td>{chapter.price}</td>
                  <td>
                    <button onClick={() => handlePurchase(chapter.id)} className="btn btn-primary">購買</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SelectChapter;
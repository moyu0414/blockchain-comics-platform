import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { useParams } from 'react-router-dom';
import comicData from '../contracts/ComicPlatform.json';
import Web3 from 'web3';


const ReaderChapter = () => {
  const [web3Instance, setWeb3Instance] = useState('');
  const { comicID } = useParams();
  const [meta, setMeta] = useState('');
  const [message, updateMessage] = useState('');
  const [comic, setComic] = useState([]);
  const [purchase, isPurchase] = useState([]);
  let num = 1;
  let temp = [];
  let purchaseData = [];


  const fetchChapters = async () => {
    try {
      const storedArrayJSON = localStorage.getItem('comicDatas');
      const storedArray = JSON.parse(storedArrayJSON);
      
      for (var i = 0; i < storedArray.length; i++) {
        if(storedArray[i].comicID == comicID){
          temp.push(storedArray[i]);
        };
      };
      console.log(temp);
      setComic(temp);

      const web3Instance = new Web3(window.ethereum);
      setWeb3Instance(web3Instance);
      const contractInstance = new web3Instance.eth.Contract(comicData.abi, comicData.address);
      const accounts = await web3Instance.eth.getAccounts();
      let meta = await contractInstance.methods;
      setMeta(meta);
      const chapterInfo = await meta.getChapters(temp[0].hash).call();

      await contractInstance.getPastEvents('ChapterPurchased', {
        fromBlock: 0,
      }, function(error, events){ })
      .then(function(events){
        for (var i = 0; i < events.length; i++) {
          let id = 'Chapter' + num;
          for (var n = 0; n < chapterInfo[0].length; n++) {
            if(chapterInfo[0][n] == events[i].returnValues.chapterHash){
              purchaseData.push({
                buyer: events[i].returnValues.buyer,
                chapterHash: events[i].returnValues.chapterHash,
                title:  chapterInfo[1][n],
                chapterID: id,
                comicTitle: temp[0].title,
              });
            }
          }
          num = num + 1;
        }
      })
      console.log(purchaseData);
      isPurchase(purchaseData);
      localStorage.setItem('purchaseData', JSON.stringify(purchaseData));
    } catch (error) {
      console.error('Error fetching chapters:', error);
    }
  };

  useEffect(() => {
    fetchChapters();
  }, []);


  return (
    <div className="select-chapter-page">
      <div className="page-content">
      {comic.map((chapter, index) => (
          <div key={index}>
            <center>
              <h1>{chapter.title}</h1>
              <h2>章節選擇</h2>
            </center>
          </div>
        ))}
        <div className="chapter-selection">
          <table className="table table-image">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">本集標題</th>
                <th scope="col">操作</th>
              </tr>
            </thead>
            <tbody>
              {purchase.map((chapter, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td className='chapter-title'>{chapter.title}</td>
                  <td>
                  <Link to={`/reader_Chapter/${comicID}/${chapter.chapterID}`}> 
                    <button className="btn btn-primary" >閱讀</button>
                  </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-red-500 text-center">{message}</div>
        </div>
      </div>
    </div>
  );
};

export default ReaderChapter;
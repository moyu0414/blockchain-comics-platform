import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { useParams } from 'react-router-dom';
import comicData from '../contracts/ComicPlatform.json';
import Web3 from 'web3';

let num = 1;

const Reader_Chapter = () => {
  const [account, setAccount] = useState('');
  const [web3Instance, setWeb3Instance] = useState('');
  const { comicID } = useParams();
  const [meta, setMeta] = useState('');
  const [message, updateMessage] = useState('');
  const [purchase, isPurchase] = useState([]);
  let temp = [];
  let temp_purchase = [];


  const fetchChapters = async () => {
    try {
      const storedArrayJSON = localStorage.getItem('comicDatas');
      const storedArray = JSON.parse(storedArrayJSON);
      
      for (var i = 0; i < storedArray.length; i++) {
        if(storedArray[i].comicID == comicID){
          temp.push(storedArray[i]);
        };
      };

      const web3Instance = new Web3(window.ethereum);
      setWeb3Instance(web3Instance);
      const contractInstance = new web3Instance.eth.Contract(comicData.abi, comicData.address);
      const accounts = await web3Instance.eth.getAccounts();
      setAccount(accounts[0]);
      let meta = await contractInstance.methods;
      setMeta(meta);
      
      const chapterInfo = await meta.getChapters(temp[0].hash).call();
      await contractInstance.getPastEvents('ChapterPurchased', {
        fromBlock: 0,
      }, function(error, events){ })
      .then(function(events){
        console.log(events);
        for (var i = 0; i < chapterInfo[0].length; i++) {
          let id = 'Chapter' + num;

          if(chapterInfo[0][i] == events[0].returnValues.chapterHash){
            temp_purchase.push({
              buyer: events[0].returnValues.buyer,
              chapterHash: events[0].returnValues.chapterHash,
              title:  chapterInfo[1][i],
              chapterID: id
            });
          }
          num = num + 1;
        }
      })
      console.log(temp_purchase);
      isPurchase(temp_purchase);

    } catch (error) {
      console.error('Error fetching chapters:', error);
    }
  };

  useEffect(() => {
    fetchChapters();
  }, []);

  async function disableButton() {
    const listButton = document.getElementById("list-button")
    listButton.disabled = true
    listButton.style.backgroundColor = "grey";
    listButton.style.opacity = 0.3;
  }

  async function enableButton() {
      const listButton = document.getElementById("list-button")
      listButton.disabled = false
      listButton.style.backgroundColor = "#A500FF";
      listButton.style.opacity = 1;
  }


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
                <th scope="col">操作</th>
              </tr>
            </thead>
            <tbody>
              {purchase.map((chapter, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td className='chapter-title'>{chapter.title}</td>

                  <Link to={`/reader_Chapter/${comicID}/${chapter.chapterID}`}> {/* 將 comicID 作為路由參數 */}
                    <td>
                      <button className="btn btn-primary" id="list-button">閱讀</button>
                    </td>
                  </Link>
                  
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

export default Reader_Chapter;
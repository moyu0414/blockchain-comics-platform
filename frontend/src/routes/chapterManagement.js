import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import comicData from '../contracts/ComicPlatform.json';
import Web3 from 'web3';
import { Link } from 'react-router-dom';
import { Button } from 'react-bootstrap';

const ChapterManagement = () => {
  const [account, setAccount] = useState('');
  const [chapters, setChapters] = useState([]);
  const { comicID } = useParams();
  const [meta, setMeta] = useState('');
  const [comic, setComic] = useState([]);
  const [message, updateMessage] = useState('');
  const [showChapterForm, setShowChapterForm] = useState(false);
  let temp = [];
  let temp_data = [];

  const fetchChapters = async () => {
    try {
      const storedArrayJSON = localStorage.getItem('comicDatas');
      const storedArray = JSON.parse(storedArrayJSON);
      
      for (var i = 0; i < storedArray.length; i++) {
        if(storedArray[i].comicID == comicID){
          temp.push(storedArray[i]);
        };
      };
      //console.log(temp);
      setComic(temp);

      const web3Instance = new Web3(window.ethereum);
      const contractInstance = new web3Instance.eth.Contract(comicData.abi, comicData.address);
      const accounts = await web3Instance.eth.getAccounts();
      setAccount(accounts[0]);
      let meta = await contractInstance.methods;
      setMeta(meta);
      
      const chapterInfo = await meta.getChapters(temp[0].hash).call();
      for (var i = 0; i < chapterInfo[0].length; i++) {
        let temp_price = chapterInfo[2][i].toString();
        temp_price = temp_price / 1e18;
        temp_data.push({
          chapterHash: chapterInfo[0][i],
          title: chapterInfo[1][i],
          price: temp_price
        });
      }
      console.log(temp_data);
      setChapters(temp_data);
      
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
        <div className="d-flex justify-content-end mt-3">
          <Button variant="primary">
          {chapters.length > 0 && (
            <Link
            to={"/createWork"}
            state={{ showChapterForm: true, chapterHash: chapters[0].chapterHash }}
            style={{ textDecoration: 'none', color: 'inherit' }}
            >
              新增章節
          </Link>
          )}
          </Button>
        </div>
        <div className="chapter-selection">
          <table className="table table-image">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">本集標題</th>
                <th scope="col">價格</th>
                <th scope="col"></th>
              </tr>
            </thead>
            <tbody>
              {chapters.map((chapter, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td className='chapter-title'>{chapter.title}</td>
                  <td>{chapter.price}</td>
                  <td >
                    <button className="btn btn-primary" id="list-button" style={{ marginRight: '15px' }}>閱讀</button>
                    <button className="btn btn-success" id="list-button">翻譯</button>
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

export default ChapterManagement;
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import comicData from '../contracts/ComicPlatform.json';
import Web3 from 'web3';
import { Link } from 'react-router-dom';
import { Button } from 'react-bootstrap';

const ChapterManagement = () => {
  const [chapters, setChapters] = useState([]);
  const { comicID } = useParams();
  const [meta, setMeta] = useState('');
  const [comic, setComic] = useState([]);
  const [message, updateMessage] = useState('');
  const [showChapterForm, setShowChapterForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const currentAccount = localStorage.getItem("currentAccount");
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
      console.log(temp);
      setComic(temp);

      const web3Instance = new Web3(window.ethereum);
      const contractInstance = new web3Instance.eth.Contract(comicData.abi, comicData.address);
      let meta = await contractInstance.methods;
      setMeta(meta);

      const chapterInfo = await meta.getChapters(temp[0].hash).call();
      console.log(chapterInfo);
      
      let num = 1;
      for (var i = 0; i < chapterInfo[0].length; i++) {  //本漫畫所有章節        
        if (currentAccount == temp[0].author){
          let id = 'Chapter' + num;
          let temp_price = chapterInfo[2][i].toString();
          temp_price = temp_price / 1e18;
          temp_data.push({
            title: chapterInfo[1][i],
            chapterPrice: temp_price,
            chapterID: id
          });
          num = num + 1;
        }
      };

      console.log(temp_data);
      setChapters(temp_data);
      setLoading(false);
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
        {comic.map((Comic, index) => (
          <div className='comic-chapter-title' key={index}>
            <center>
              <h1>{Comic.title}</h1>
              <h4>作者：您是本作品的創作者!</h4>
              <h2>創作者管理_章節選擇</h2>
            </center>
          </div>
        ))}
        {!loading &&  
          <div className="create-chapter d-flex justify-content-end mt-2">
            <Button>
             <Link
                to={"/createWork"}
                state={{ showChapterForm: true, comicHash: comic.length > 0 ? comic[0].hash : null }}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                新增章節
              </Link>
            </Button>
          </div>
        }
        {!loading &&
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
                    <td>{chapter.chapterPrice}</td>
                    <td >
                      <Link to={`/reading/${comicID}/${chapter.chapterID}`}> 
                        <button className="btn btn-primary" style={{ marginRight: '15px' }}>閱讀</button>
                      </Link>
                      <button className="btn btn-success" id="list-button">翻譯</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
        {loading &&  
          <div className="loading-container">
            <div>章節加載中，請稍後...</div>
          </div>
        }
      </div>
    </div>
  );
};

export default ChapterManagement;

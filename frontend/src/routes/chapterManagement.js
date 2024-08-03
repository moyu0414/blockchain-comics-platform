import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import comicData from '../contracts/ComicPlatform.json';
import Web3 from 'web3';
import { Link } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import axios from 'axios';
import { sortByTimestamp } from '../index';

const ChapterManagement = () => {
  const [comic, setComic] = useState([]);
  const [chapters, setChapters] = useState([]);
  const { comicID } = useParams();
  const [showChapterForm, setShowChapterForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const currentAccount = localStorage.getItem("currentAccount");
  let temp = [];
  let chapterInfo = [];
  let temp_data = [];

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
      setComic(temp);
      console.log(temp);

      try {  // 這本漫畫得所有章節
        const response = await axios.get('https://web3toonapi.ddns.net/api/chapters', {
          params: {
            comicHash: temp[0].comicHash
          }
        });
        chapterInfo = response.data;
      } catch (error) {
        console.error('Error fetching records:', error);
      }
      sortByTimestamp(chapterInfo);
      console.log(chapterInfo);

      let num = 1;
      for (var i = 0; i < chapterInfo.length; i++) {  //本漫畫所有章節        
        if (currentAccount == temp[0].author){
          let id = 'Chapter' + num;
          temp_data.push({
            title: chapterInfo[i].chapterTitle,
            chapterPrice: chapterInfo[i].price.toString(),
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
              <h2>創作者管理_章節選擇</h2>
              <h1>{Comic.title}</h1>
              <h4>作者：您是本作品的創作者!</h4>
            </center>
          </div>
        ))}
        {!loading &&  
          <div className="create-chapter d-flex justify-content-end mt-2">
            <Button style={{ marginRight: '15px' }}>
             <Link
                to={"/editWork"}
                state={{ showChapterForm: false, comicID: comic.length > 0 ? comic[0].comicID: null }}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                編輯漫畫
              </Link>
            </Button>
            <Button style={{ marginRight: '15px' }}>
             <Link
                to={"/createWork"}
                //state={{ showChapterForm: true, comicHash: comic.length > 0 ? comic[0].hash : null }}
                state={{ showChapterForm: true, comicHash: comic.length > 0 ? comic[0].comicHash : null }}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                新增章節
              </Link>
            </Button>
            <Button>
             <Link
                to={"/mintNFT"}
                state={{ comicID: comic.length > 0 ? comic[0].comicID: null }}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                鑄造NFT
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
                      <button className="btn" id="list-button" style={{ marginRight: '15px' }}>翻譯</button>
                      <Link
                        to={"/editWork"}
                        state={{
                          showChapterForm: true,
                          comicID: comic.length > 0 ? comic[0].comicID : null,
                          chapterID: chapters.length > 0 ? chapter.chapterID : null
                        }}
                        style={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        <button className="btn">編輯</button>
                      </Link>
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

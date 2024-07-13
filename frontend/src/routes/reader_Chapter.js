import { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { useParams } from 'react-router-dom';
import { formatDate, formatTime, sortByDatetime, sortByTimestamp } from '../index.js';
import axios from 'axios';
//import comicData from '../contracts/ComicPlatform.json';

const ReaderChapter = () => {
  const { comicID } = useParams();
  const [message, updateMessage] = useState('');
  const [comic, setComic] = useState([]);
  const [purchase, isPurchase] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthor, setIsAuthor] = useState('');
  const currentAccount = localStorage.getItem("currentAccount");
  let temp = [];
  let chapterInfo = [];
  let readerLogs = [];
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
      setComic(temp);
      //console.log(temp);

      try {  // 這本漫畫得所有章節
        const response = await axios.get('http://localhost:5000/api/chapters', {
          params: {
            comicHash: temp[0].comicHash
          }
        });
        chapterInfo = response.data;
      } catch (error) {
        console.error('Error fetching records:', error);
      }
      sortByTimestamp(chapterInfo);
      //console.log(chapterInfo);

      try {
        const response = await axios.get('http://localhost:5000/api/selectChapter/records', {
          params: {
            currentAccount: currentAccount,
            comicHash: temp[0].comicHash
          }
        });
        readerLogs = response.data;
      } catch (error) {
        console.error('Error fetching reader records:', error);
      }
      sortByDatetime(readerLogs);
      //console.log(readerLogs);

      for (var n = 0; n < chapterInfo.length; n++) {
        let id = 'Chapter' + (n + 1);
        let purchasedChapter = readerLogs.find(log => log.chapterHash === chapterInfo[n].chapterHash);
        if (purchasedChapter) {
          let date = formatDate(new Date(purchasedChapter.purchase_date));
          let time = formatTime(new Date(purchasedChapter.purchase_date));
          temp_purchase.push({
            chapterID: id,
            title: purchasedChapter.chapterTitle,
            price: purchasedChapter.recordsPrice,
            date: date,
            time: time,
            chapterHash: purchasedChapter.chapterHash
          });
        }
      }

      console.log(temp_purchase);
      isPurchase(temp_purchase);
      setIsAuthor(temp[0].author);
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
      {comic.map((chapter, index) => (
          <div className='comic-chapter-title' key={index}>
            <center>
              <h2>讀者閱讀_章節選擇</h2>
              <h1>{chapter.title}</h1>
              <h4>作者：{isAuthor}</h4>
            </center>
          </div>
        ))}
        {loading &&  
          <div className="loading-container">
            <div>章節加載中，請稍後...</div>
          </div>
        }
        <div className="chapter-selection">
          <table className="table table-image">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">本集標題</th>
                <th scope="col">交易金額</th>
                <th scope="col">購買時間</th>
                <th scope="col"></th>
              </tr>
            </thead>
            <tbody>
              {purchase.map((chapter, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td className='chapter-title'>{chapter.title}</td>
                  <td>{chapter.price}</td>
                  <td>{chapter.date}<br />{chapter.time}</td>
                  <td>
                    <Link to={`/reading/${comicID}/${chapter.chapterID}`}> 
                      <button className="btn" >閱讀</button>
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
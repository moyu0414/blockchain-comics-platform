import { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { useParams } from 'react-router-dom';
//import comicData from '../contracts/ComicPlatform.json';

const ReaderChapter = () => {
  const { comicID } = useParams();
  const [message, updateMessage] = useState('');
  const [comic, setComic] = useState([]);
  const [purchase, isPurchase] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentAccount = localStorage.getItem("currentAccount");
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
      console.log(temp);
      setComic(temp);

      const chapterArrayJSON = localStorage.getItem('purchaseData');
      const chapterArray = JSON.parse(chapterArrayJSON);
      console.log(chapterArray);

      for (var i = 0; i < chapterArray.length; i++) {
        if(chapterArray[i].comicID == comicID && chapterArray[i].buyer == currentAccount){
          temp_purchase.push({
            chapterID: chapterArray[i].chapterID,
            title: chapterArray[i].title,
            price: chapterArray[i].chapterPrice,
            date: chapterArray[i].date,
            time: chapterArray[i].time
          });
        };
      };
      console.log(temp_purchase);
      isPurchase(temp_purchase);
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
              <h1>{chapter.title}</h1>
              <h2>讀者閱讀_章節選擇</h2>
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
import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import comicData from '../contracts/ComicPlatform_0526.json';
import { Button } from 'react-bootstrap';

const ComicManagement = ({ contractAddress }) => {
  const storedArrayJSON = localStorage.getItem('comicDatas');
  const currentAccount = localStorage.getItem("currentAccount");
  const [meta, setMeta] = useState('');
  const [current, setCurrent] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [message, updateMessage] = useState('');

  useEffect(() => {
    const connectToWeb3 = async () => {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const web3Instance = new Web3(window.ethereum);
        const contractInstance = new web3Instance.eth.Contract(comicData.abi, comicData.address);
        const meta = await contractInstance.methods;
        setMeta(meta);
        let admin = await meta.admins(currentAccount).call();
        setIsAdmin(admin);
        let all_Comic = await meta.getAllComicHashes().call(); // 所有最新的漫畫 Hash
        console.log(all_Comic);

        if (admin == true) {
          let storedArray = JSON.parse(storedArrayJSON);
          //console.log('Stored Comics Array:', storedArray);
          storedArray.forEach(obj => {
            obj.exists = '刪除';  // 現有的皆存在
          });
          for (var i = 0; i < all_Comic[0].length; i++) {
            if (all_Comic[2][i] == false) {
              let editcomicHash = await meta.editcomicHistory(all_Comic[0][i]).call(); // 所有最新的漫畫 Hash
              let comics = await meta.comics(editcomicHash).call(); // 所有最新的漫畫 Hash
              
              storedArray.push({
                title: all_Comic[1][i],
                author: comics.author,
                hash: all_Comic[0][i],
                exists: '復原'
              });
            } 
          };
          console.log(storedArray);
          setCurrent(storedArray);
        }
      } catch (error) {
        console.error(error);
      }
    };
    connectToWeb3();
  }, [storedArrayJSON]);


  // 漫畫刪除 或 復原函數
  const handleToggle = async (comicId) => {
    const comic = current[comicId]; // 使用傳遞進來的索引值來訪問章節資料
    const operationValue = comic.exists;
    const comicHash = current[comicId].hash;
    disableAllButtons();

    if (operationValue === '刪除') {
      try{
        updateMessage("正在刪除漫畫中...請稍後。");
        await meta.toggleComicExistence(comicHash).send({ from: currentAccount });
        alert('漫畫刪除成功！');
        updateMessage("");
        const updatedComics = [...current];
        updatedComics[comicId].exists = '復原'; // 更新漫畫狀態
        setCurrent(updatedComics);
      } catch (error) {
        console.error('漫畫刪除時發生錯誤：', error);
        alert(error);
        window.location.reload();
        updateMessage("");
      } finally {
        enableAllButtons();
      }
    } else {
      try{
        updateMessage("正在復原漫畫中...請稍後。");
        await meta.toggleComicExistence(comicHash).send({ from: currentAccount });
        alert('漫畫復原成功！');
        updateMessage("");
        const updatedComics = [...current];
        updatedComics[comicId].exists = '刪除'; // 更新漫畫狀態
        setCurrent(updatedComics);
      } catch (error) {
        console.error('漫畫復原時發生錯誤：', error);
        alert(error);
        window.location.reload();
        updateMessage("");
      } finally {
        enableAllButtons();
      }
    } 
  };

  const enableAllButtons = () => {
    const buttons = document.querySelectorAll(".btn");
    buttons.forEach(button => {
      button.disabled = false;
      button.style.backgroundColor = "#0FC2C0";
      button.style.opacity = 1;
    });
  };

  const disableAllButtons = () => {
    const buttons = document.querySelectorAll(".btn");
    buttons.forEach(button => {
      button.disabled = true;
      button.style.backgroundColor = "grey";
      button.style.opacity = 0.3;
    });
  };


  return (
    <div className="management-page">
      <h2 className="title-text">管理者_漫畫管理</h2>
      {isAdmin ? (
        <>
          <div className="page-content">
            <div className="chapter-selection">
              <table className="table table-image">
                <thead>
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">漫畫標題</th>
                    <th scope="col">作者</th>
                    <th scope="col">漫畫Hash</th>
                    <th scope="col">狀態</th>
                    <th scope="col"></th>
                  </tr>
                </thead>
                <tbody>
                  {current.map((comic, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td className='management-title'>{comic.title}</td>
                      <td>{comic.author}</td>
                      <td>{comic.hash}</td>

                      <td>
                        <button onClick={() => handleToggle(index)} className="btn" value={comic.exists}>{comic.exists}</button>
                      </td>
                    
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="text-red-500 text-center">{message}</div>
            </div>
          </div>
        </>
      ) : (
        <div className="loading-container">
          <div>目前您並不是管理者，請稍後再試...</div>
        </div>
      )}
    </div>
  );
};

export default ComicManagement;

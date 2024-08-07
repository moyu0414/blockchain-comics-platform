import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import comicData from '../contracts/ComicPlatform.json';
//import { Button } from 'react-bootstrap';
import axios from 'axios';

const ComicManagement = ({ contractAddress }) => {
  const storedArrayJSON = localStorage.getItem('comicDatas');
  const currentAccount = localStorage.getItem("currentAccount");
  const [meta, setMeta] = useState('');
  const [current, setCurrent] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [message, updateMessage] = useState('');
  const [messageAccount, updateMessageAccount] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [web3Instance, setWeb3Instance] = useState('');
  let modifiedArray = [];

  useEffect(() => {
    const connectToWeb3 = async () => {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const web3Instance = new Web3(window.ethereum);
        setWeb3Instance(web3Instance);
        const contractInstance = new web3Instance.eth.Contract(comicData.abi, comicData.address);
        const meta = await contractInstance.methods;
        setMeta(meta);
        let admin = await meta.admins(currentAccount).call();
        setIsAdmin(admin);

        if (admin == true) {
          let storedArray = JSON.parse(storedArrayJSON);
          //console.log('Stored Comics Array:', storedArray);
          
          for (let i = 0; i < storedArray.length; i++) {
            let status = storedArray[i].exists === 1 ? '刪除' : '復原';  // 根据 exists 属性决定要添加的状态
            modifiedArray.push({
              title: storedArray[i].title,
              author: storedArray[i].author,
              hash: storedArray[i].comicHash,
              exists: status
            });
          }
          console.log(modifiedArray);
          setCurrent(modifiedArray);
        }
      } catch (error) {
        console.error(error);
      }
    };
    connectToWeb3();
  }, [storedArrayJSON]);


  // 漫畫刪除 或 復原函數
  const handleToggle = async (comicId) => {
    const comic = current[comicId];
    const operationValue = comic.exists;
    const comicHash = current[comicId].hash;
    disableAllButtons();

    if (operationValue === '刪除') {
      try{
        updateMessage("正在刪除漫畫中...請稍後。");
        await meta.toggleComicExistence(comicHash).send({ from: currentAccount });
        await axios.put('http://localhost:5000/api/update/comicExist', {
          comicHash: comicHash,
          is_exist: 0,
        });

        alert('漫畫刪除成功！');
        updateMessage("");
        window.location.reload();
        const updatedComics = [...current];
        updatedComics[comicId].exists = '復原'; // 更新漫畫狀態
        setCurrent(updatedComics);
      } catch (error) {
        console.error('漫畫刪除時發生錯誤：', error);
        alert(error);
        updateMessage("");
      } finally {
        enableAllButtons();
      }
    } else {
      try{
        updateMessage("正在復原漫畫中...請稍後。");
        await meta.toggleComicExistence(comicHash).send({ from: currentAccount });
        await axios.put('http://localhost:5000/api/update/comicExist', {
          comicHash: comicHash,
          is_exist: 1,
        });

        alert('漫畫復原成功！');
        updateMessage("");
        window.location.reload();
        const updatedComics = [...current];
        updatedComics[comicId].exists = '刪除'; // 更新漫畫狀態
        setCurrent(updatedComics);
      } catch (error) {
        console.error('漫畫復原時發生錯誤：', error);
        alert(error);
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


  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

  const addAdmin = async () => {
    disableAllButtons();
    updateMessageAccount("正在新增管理者中...請稍後。");
    let address = web3Instance.utils.isAddress(inputValue);
    if (address == true) {
      address = web3Instance.utils.toChecksumAddress(inputValue);
      try{
        let admins = await meta.admins(address).call();
        if (admins == true) {
          alert("此帳號已是管理者!");
        } else {
          await meta.addAdmin(inputValue).send({ from: currentAccount });
          alert('管理者新增成功！');
        }
        updateMessageAccount("");
      } catch (error) {
        console.error('管理者新增時發生錯誤：', error);
        alert(error);
        updateMessageAccount("");
      } finally {
        enableAllButtons();
      }
    } else {
      alert("請輸入有效的帳號!");
      enableAllButtons();
      updateMessageAccount("");
    };
  };

  const removeAdmin = async () => {
    disableAllButtons();
    updateMessageAccount("正在刪除管理者中...請稍後。");
    let address = web3Instance.utils.isAddress(inputValue);
    if (address == true) {
      address = web3Instance.utils.toChecksumAddress(inputValue);
      try{
        let admins = await meta.admins(address).call();
        if (admins == false) {
          alert("此帳號並非管理者，所以不用刪除!");
        } else {
          await meta.removeAdmin(inputValue).send({ from: currentAccount });
          alert('管理者刪除成功！');
        }
        updateMessageAccount("");
      } catch (error) {
        console.error('管理者刪除時發生錯誤：', error);
        alert(error);
        updateMessageAccount("");
      } finally {
        enableAllButtons();
      }
    } else {
      alert("請輸入有效的帳號!");
      enableAllButtons();
      updateMessageAccount("");
    };
  };


  return (
    <div className="management-page">
      {isAdmin ? (
        <>
          <h2 className="title-text">帳號管理</h2>
          <div className="management-btn mb-5">
            <input value={inputValue} type="text" placeholder="請輸入帳號" onChange={handleInputChange} style={{width: '420px'}}></input>
            <button  onClick={addAdmin} className="btn" style={{ marginLeft: '15px', marginRight: '15px' }}>
              新增管理者
            </button>
            <button onClick={removeAdmin} className="btn">
              刪除管理者
            </button >
            <div className="text-red-500 text-center" style={{marginTop: '10px'}}>{messageAccount}</div>
          </div>
          <div className="page-content">
            <div className="chapter-selection">
              <h2 className="title-text">漫畫管理</h2>
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
                      <td className='comic-management-title'>{comic.title}</td>
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

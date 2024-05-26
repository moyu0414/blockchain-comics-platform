import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import comicData from '../contracts/ComicPlatform_0526.json';
import Web3 from 'web3';
import $ from 'jquery';

const ComicManagement = ({ contractAddress }) =>  {
  const currentAccount = localStorage.getItem("currentAccount");
  const [web3Instance, setWeb3Instance] = useState('');
  const [meta, setMeta] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [message, updateMessage] = useState('');
  const [inputValue, setInputValue] = useState('');

  const connectToWeb3 = async () => {
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const web3Instance = new Web3(window.ethereum);
      setWeb3Instance(web3Instance);
      const contractInstance = new web3Instance.eth.Contract(comicData.abi, comicData.address);
      console.log(contractInstance);

      const meta = await contractInstance.methods;
      setMeta(meta);

      let admin = await meta.admins(currentAccount).call();
      setIsAdmin(admin);

    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    connectToWeb3();
  }, []);

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

  const addAdmin = async () => {
    disableAllButtons();
    updateMessage("正在新增管理者中...請稍後。");

    let address = web3Instance.utils.isAddress(inputValue);
    if (address == true) {
      address = web3Instance.utils.toChecksumAddress(inputValue);
      try{
        await meta.addAdmin(inputValue).send({ from: currentAccount });

        alert('管理者新增成功！');
        updateMessage("");
        //const updatedComics = [...current];
        //updatedComics[comicId].exists = '復原'; // 更新漫畫狀態
        //setCurrent(updatedComics);
      } catch (error) {
        console.error('管理者新增時發生錯誤：', error);
        alert(error);
        //window.location.reload();
        updateMessage("");
      } finally {
        enableAllButtons();
      }

    } else {
      alert("請輸入有效的帳戶!");
      enableAllButtons();
    };
  };
  

  const removeAdmin = async () => {




  };

  const disableAllButtons = () => {
    const buttons = document.querySelectorAll(".btn");
    buttons.forEach(button => {
      button.disabled = true;
      button.style.backgroundColor = "grey";
      button.style.opacity = 0.3;
    });
  };
  
  const enableAllButtons = () => {
    const buttons = document.querySelectorAll(".btn");
    buttons.forEach(button => {
      button.disabled = false;
      button.style.backgroundColor = "#0FC2C0";
      button.style.opacity = 1;
    });
  };

  return (
    <div className="management-page">
      <h2 className="title-text">管理者_帳號管理</h2>
      {isAdmin ? (
        <>
          <div className="management-btn">
            <input value={inputValue} type="text" placeholder="請輸入帳號" onChange={handleInputChange} style={{width: '420px'}}></input>
            <button  onClick={addAdmin} className="btn" style={{ marginLeft: '15px', marginRight: '15px' }}>
              新增管理者
            </button>
            <button onClick={removeAdmin} className="btn">
              刪除管理者
            </button >
          </div>

          <div className="page-content">
            <div className="chapter-selection">
              <table className="table table-image">
                <thead>
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">作者帳號</th>
                    <th scope="col"></th>
                  </tr>
                </thead>
                <tbody>
                    <tr>
                      <td>1</td>
                      <td className='chapter-title'>0xb4C39375f9cBCCdD5dA4423F210A74f7Cbd110B7</td>
                      {/* <td>
                        <button onClick={() => handlePurchase(index)} className="btn" value={chapter.isBuying}>{chapter.isBuying}</button>
                      </td> */}
                    </tr>
                    <tr>
                      <td>2</td>
                      <td className='chapter-title'>0xC6Bf9f4E9C1042Ca3aF0a33ce51506c3a123162c</td>
                      {/* <td>
                        <button onClick={() => handlePurchase(index)} className="btn" value={chapter.isBuying}>{chapter.isBuying}</button>
                      </td> */}
                    </tr>
                    <tr>
                      <td>3</td>
                      <td className='chapter-title'>0x25D24F03a642f90Ede6413A393E7a4027467D275</td>
                      {/* <td>
                        <button onClick={() => handlePurchase(index)} className="btn" value={chapter.isBuying}>{chapter.isBuying}</button>
                      </td> */}
                    </tr>
                </tbody>
              </table>
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

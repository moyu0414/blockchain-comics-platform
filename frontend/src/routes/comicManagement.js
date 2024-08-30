import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import comicData from '../contracts/ComicPlatform.json';
import {  Container, Table, Button, Form, Tabs, Tab, InputGroup, FormControl} from 'react-bootstrap';
import { PlusLg, TrashFill, Search } from 'react-bootstrap-icons';
import { disableAllButtons, enableAllButtons } from '../index';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import axios from 'axios';
const website = process.env.REACT_APP_Website;
const API_KEY = process.env.REACT_APP_API_KEY;

const ComicManagement = ({ contractAddress }) => {
  const storedArrayJSON = localStorage.getItem('comicDatas');
  const currentAccount = localStorage.getItem("currentAccount");
  const [storedArray, setStoredArray] = useState([]);
  const [meta, setMeta] = useState('');
  const [current, setCurrent] = useState([]);
  const [admin, setAdmin] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [web3Instance, setWeb3Instance] = useState('');
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  const headers = {'api-key': API_KEY};
  let modifiedArray = [];

  useEffect(() => {
    const initialData = async () => {
      try {
        const response = await axios.get(`${website}/api/comicManagement/isAdmin`, {
          headers: headers,
          params: {
            currentAccount: currentAccount
          }
        });
        let isAdmin = response.data;
        if (isAdmin.exists === true) {
          try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            const web3Instance = new Web3(window.ethereum);
            setWeb3Instance(web3Instance);
            const contractInstance = new web3Instance.eth.Contract(comicData.abi, comicData.address);
            const meta = await contractInstance.methods;
            setMeta(meta);

            setAdmin(isAdmin.address);
            let storedArray = JSON.parse(storedArrayJSON);
            setStoredArray(storedArray);
            for (let i = 0; i < storedArray.length; i++) {
              let status = storedArray[i].is_exist === 1 ? t('刪除') : t('復原');  // 根据 exists 属性决定要添加的状态
              modifiedArray.push({
                title: storedArray[i].title,
                author: storedArray[i].creator,
                hash: storedArray[i].comic_id,
                exists: status
              });
            }
            //console.log(modifiedArray);
            setCurrent(modifiedArray);
            setSearchResults(modifiedArray);
            setLoading(false);
          } catch (error) {
            console.error(error);
          }
        } else {
          alert(t('您並非管理者'));
          return;
        }
      } catch (error) {
        console.error(error);
      }
    };
    initialData();
  }, []);

  useEffect(() => {
    if (window.innerWidth <= 1200) {
      setIsMobile(true);
    }
  }, []);

  // 漫畫刪除 或 復原函數
  const handleToggle = async (comicHash, exists) => {
    disableAllButtons();
    if (exists === t('刪除')) {
      try{
        await meta.toggleComicExistence(comicHash).send({ from: currentAccount });
        await axios.put(`${website}/api/update/comicExist`, null, {
          headers: headers,
          params: {
            comicHash: comicHash,
            is_exist: 0
          },
        });
        const updatedComics = searchResults.map(comic =>
          comic.hash === comicHash
            ? { ...comic, exists: t('復原') }
            : comic
        );
        setSearchResults(updatedComics);
        alert(t('漫畫刪除成功'));
        const updatedArray = storedArray.map(item =>
          item.comic_id === comicHash
            ? { ...item, is_exist: 0 }
            : item
        );
        const updatedArrayJSON = JSON.stringify(updatedArray);
        localStorage.setItem('comicDatas', updatedArrayJSON);
      } catch (error) {
        if (error.message.includes('User denied transaction signature')) {
          alert(t('拒绝交易'));
        } else {
          console.error('漫畫刪除時發生錯誤：', error);
          alert(error);
        }
      } finally {
        enableAllButtons();
      }
    } else {
      try{
        await meta.toggleComicExistence(comicHash).send({ from: currentAccount });
        await axios.put(`${website}/api/update/comicExist`, null, {
          headers: headers,
          params: {
            comicHash: comicHash,
            is_exist: 1,
          },
        });
        const updatedComics = searchResults.map(comic =>
          comic.hash === comicHash
            ? { ...comic, exists: t('刪除') }
            : comic
        );
        setSearchResults(updatedComics);
        alert(t('漫畫復原成功'));
        const updatedArray = storedArray.map(item =>
          item.comic_id === comicHash
            ? { ...item, is_exist: 1 }
            : item
        );
        const updatedArrayJSON = JSON.stringify(updatedArray);
        localStorage.setItem('comicDatas', updatedArrayJSON);
      } catch (error) {
        if (error.message.includes('User denied transaction signature')) {
          alert(t('拒绝交易'));
        } else {
          console.error('漫畫復原時發生錯誤：', error);
          alert(error);
        }
      } finally {
        enableAllButtons();
      }
    } 
  };

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const addAdmin = async () => {
    disableAllButtons();
    let address = web3Instance.utils.isAddress(inputValue);
    if (!address) {
      alert(t('請輸入有效的帳號'));
      enableAllButtons();
      return;
    }
    try{
      const admins = admin.some(adminItem => adminItem.address === inputValue);
      if (admins == true) {
        alert(t('此帳號已是管理者'));
      } else {
        await meta.addAdmin(inputValue).send({ from: currentAccount });
        
        const response = await axios.put(`${website}/api/update/addAdmin`, null, {
          headers: headers,
          params: {
            address: inputValue,
          },
        });
        alert(t('管理者新增成功'));
        window.location.reload();
      }
    } catch (error) {
      if (error.message.includes('User denied transaction signature')) {
        alert(t('拒绝交易'));
      } else {
        console.error('管理者新增時發生錯誤：', error);
        alert(error);
      }
    } finally {
      enableAllButtons();
    }
  };

  const removeAdmin = async (address) => {
    disableAllButtons();
    const admins = admin.some(adminItem => adminItem.address === address);
    try{
      let admins = await meta.admins(address).call();
      if (admins == false) {
        alert(t('此帳號並非管理者，所以不用刪除'));
      } else {
        await meta.removeAdmin(address).send({ from: currentAccount });

        const response = await axios.put(`${website}/api/update/removeAdmin`, null, {
          headers: headers,
          params: {
            address: address,
          },
        });
        alert(t('管理者刪除成功'));
        window.location.reload();
      }
    } catch (error) {
      if (error.message.includes('User denied transaction signature')) {
        alert(t('拒绝交易'));
      } else {
        console.error('管理者刪除時發生錯誤：', error);
        alert(error);
      }
    } finally {
      enableAllButtons();
    }
  };

  const handleSearchSubmit = async (event) => {
    event.preventDefault();
    if (searchTerm.trim() === '') {
      setSearchResults(current);
      return;
    }
    const results = current.filter(item => 
      item.title.includes(searchTerm) ||
      item.author.includes(searchTerm) ||
      item.hash.includes(searchTerm)
    );
    setSearchResults(results);
  };

  const handleRowClick = (index) => {
    if (isMobile) {
      setSelectedIndex(selectedIndex === index ? null : index);
    }
  };

  
  return (
    <>
    {!loading && (
      <Container className="comicManagement mt-4">
        <div className="table-wrapper">
          <Tabs defaultActiveKey="tab1" id="tabs" className="mb-3">
            <Tab eventKey="tab1" title={t('管理員')}>
              <Form className="d-flex ms-3">
                <InputGroup>
                  <FormControl
                    placeholder={t('請輸入管理員帳號')}
                    aria-label="Search"
                    aria-describedby="basic-addon2"
                    onChange={handleInputChange}
                  />
                </InputGroup>
              </Form>
              <div className="table-title mt-3 mb-3 d-flex justify-content-between align-items-center">
                <h2><b>{t('帳號管理')}</b></h2>
                <div>
                  <Button onClick={addAdmin} className='add-btn' variant="outline-danger" data-backgroundcolor="#0FC2C0">
                    <PlusLg title="Add" size={24}/> {t('新增管理員')}
                  </Button>
                </div>
              </div>
              <Table striped hover>
                <thead>
                  <tr>
                    <th></th>
                    <th>#</th>
                    <th>{t('帳號')}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {admin.map((data, index) => (
                    <tr key={index}>
                      <th></th>
                      <th>{index + 1}</th>
                      <td className="address-cell">{data.address}</td>
                      <td className="text-end">
                        <Button onClick={() => removeAdmin(data.address)} className='del-btn' variant="outline-danger" data-backgroundcolor="#0FC2C0">
                          <TrashFill title="Delete" /> <span className="del-text">{t('刪除')}</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Tab>
            <Tab eventKey="tab2" title={t('漫畫')}>
              <Form onSubmit={handleSearchSubmit} className="d-flex ms-3">
                  <InputGroup>
                      <FormControl
                          placeholder={t('請輸入漫畫名或作者名')}
                          aria-label="Search"
                          aria-describedby="basic-addon2"
                          value={searchTerm}
                          onChange={handleSearchChange}
                      />
                  </InputGroup>
              </Form>
              <div className="table-title mt-3 mb-3 d-flex justify-content-between align-items-center">
                <h2><b>{t('管理漫畫')}</b></h2>
                <Search onClick={handleSearchSubmit} className="comicManagement-search" />
              </div>
              <Table striped hover>
                <thead>
                  <tr>
                    <th></th>
                    <th>#</th>
                    <th>{t('漫畫')}</th>
                    <th>{t('作者')}</th>
                    {!isMobile &&
                      <td>
                        <th>{t('漫畫Hash')}</th>
                      </td>
                    }
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {searchResults.map((data, index) => (
                    <React.Fragment key={index}>
                      <tr
                        onClick={() => handleRowClick(index)}
                        style={{ cursor: 'pointer' }}
                      >
                        <th></th>
                        <th>{index + 1}</th>
                        <td>{data.title}</td>
                        <td className="author-cell">{data.author}</td>
                        {!isMobile &&
                          <td>
                            {data.hash}
                          </td>
                        }
                        <td className="text-end">
                          <Button
                            onClick={() => handleToggle(data.hash, data.exists)}
                            className='del-btn-comic btn'
                            variant="outline-danger"
                            data-backgroundcolor="#0FC2C0"
                          >
                            {data.exists}
                          </Button>
                        </td>
                      </tr>
                      {/* Only shown on small screens when a row is selected */}
                      {isMobile && selectedIndex === index && (
                        <tr className="hash-cell expanded">
                          <td style={{ width: "1%" }}></td>
                          <td style={{ width: "1%" }}></td>
                          <td colSpan="3">
                            <div className="hash-cell-text">
                              <strong>{t('漫畫Hash')}:</strong> {data.hash}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </Table>
            </Tab>
          </Tabs>
        </div>
      </Container>
    )}
    {loading && (
        <div className="loading-container">
            <div>{t('頁面加載中')}</div>
        </div>
    )}
    </>
  );
};

export default ComicManagement;

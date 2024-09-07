import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import comicData from '../contracts/ComicPlatform.json';
import {  Container, Table, Button, Form, Tabs, Tab, InputGroup, FormControl, Modal} from 'react-bootstrap';
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
  const [account, setAccount] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [web3Instance, setWeb3Instance] = useState('');
  const [showUser, setShowUser] = useState(false);
  const [deleteUser, setDeleteUser] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [modalState, setModalState] = useState({
    show: false,
    isConfirm: false,
    action: null,
    data: null
  });

  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  const headers = {'api-key': API_KEY};
  const statusMap = {
    0: t('刪除'),
    1: t('查核'),
    2: t('盜版')
  };
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

            const adminAddresses = isAdmin.address
                .filter(user => user.is_admin === 1)
                .map(user => user.address);
            if (adminAddresses.length > 0) {
              setAdmin(adminAddresses);
            }

            const addresses = isAdmin.address
            .map(user => ({
              address: user.address,
              is_creator: getCreatorStatus(user.is_creator)
            }))
            .sort((a, b) => {
              if (a.is_creator === '審核') return -1;
              if (b.is_creator === '審核') return 1;
              return 0;
            });
            if (addresses.length > 0) {
              setAccount(addresses);
              setUserSearchResults(addresses);
            }
            //console.log(addresses);

            let storedArray = JSON.parse(storedArrayJSON);
            setStoredArray(storedArray);
            for (let i = 0; i < storedArray.length; i++) {
              const status = statusMap[storedArray[i].is_exist];
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

  const getCreatorStatus = (status) => {
    const statusMap = {
      0: '否',
      1: '是',
      2: '審核',
      3: '禁用'
    };
    return statusMap[status] || '否';
  };

  // 漫畫刪除 或 復原函數
  const handleToggle = async (comicHash, exists, creator) => {
    console.log(exists);
    disableAllButtons();
    if (exists === 2) {
      try{
        const response = await axios.get(`${website}/api/comicManagement/totalCost`, {
          headers: headers,
          params: {
            comicHash: comicHash
          }
        });
        //console.log(response.data);
        const totalCost = web3Instance.utils.toWei(response.data, 'ether');
        console.log(totalCost);

        await meta.toggleComicExistence(comicHash, 2).send({ from: currentAccount, value: totalCost });
        await axios.put(`${website}/api/update/comicExist`, null, {
          headers: headers,
          params: {
            comicHash: comicHash,
            is_exist: 2
          },
        });
        const updatedComics = searchResults.map(comic =>
          comic.hash === comicHash
            ? { ...comic, exists: t('盜版') }
            : comic
        );
        setSearchResults(updatedComics);
        alert(t('漫畫刪除成功'));
        const updatedArray = storedArray.map(item =>
          item.comic_id === comicHash
            ? { ...item, is_exist: 2 }
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
        handleHide();
      }
    } else if (exists === 1) {
        try{
          const response = await axios.get(`${website}/api/comicManagement/totalCost`, {
            headers: headers,
            params: {
              comicHash: comicHash
            }
          });
          //console.log(response.data);
          const totalCost = web3Instance.utils.toWei(response.data, 'ether');
          console.log(totalCost);

          await meta.toggleComicExistence(comicHash, 2).send({ from: currentAccount, value: totalCost });
          await axios.put(`${website}/api/update/comicExist`, null, {
            headers: headers,
            params: {
              comicHash: comicHash,
              is_exist: 1
            },
          });
          const updatedComics = searchResults.map(comic =>
            comic.hash === comicHash
              ? { ...comic, exists: t('查核') }
              : comic
          );
          setSearchResults(updatedComics);
          alert(t('漫畫查核中'));
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
            console.error('漫畫狀態變更發生錯誤：', error);
            alert(error);
          }
        } finally {
          enableAllButtons();
          handleHide();
        }
    } else {
      try{
        await meta.toggleComicExistence(comicHash, 0).send({ from: currentAccount });
        await axios.put(`${website}/api/update/comicExist`, null, {
          headers: headers,
          params: {
            comicHash: comicHash,
            is_exist: 0,
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
            ? { ...item, is_exist: 0 }
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
        handleHide();
      }
    } 
  };

  const handleShow = (data, isConfirm = false) => {
    setModalState({
      show: true,
      isConfirm,
      action: isConfirm ? 'delete' : null,
      data
    });
  };

  const handleHide = () => setModalState(prevState => ({ ...prevState, show: false }));

  const handleConfirm = () => {
    if (modalState.data && modalState.action === 'delete') {
      handleToggle(modalState.data.hash, 2, modalState.data.creator);
    } else if (modalState.data && modalState.action === 'review') {
      handleToggle(modalState.data.hash, 1);
    }
  };

  const renderButtons = () => {
    if (!modalState.data) return null;
    const { exists, hash, creator } = modalState.data;
    switch (exists) {
      case t('刪除'):
        return (
          <>
            <Button className="mt-3" onClick={() => handleShow(modalState.data, true)}>
              {t('刪除')}
            </Button>
            <Button className="mt-3" onClick={() => handleToggle(hash, 1)}>
              {t('待查核')}
            </Button>
          </>
        );
      //case t('盜版'):
      case t('查核'):
        return (
          <>
            <Button className="mt-3" onClick={() => handleToggle(hash, 0)}>
              {t('復原')}
            </Button>
            <Button className="mt-3" onClick={() => handleToggle(hash, 2)}>
              {t('刪除')}
            </Button>
          </>
        );
      default:
        return null;
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
      const admins = admin.some(adminItem => adminItem === inputValue);
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
    const admins = admin.some(adminItem => adminItem === address);
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

  
  const accountChange = async (address, state) => {
    disableAllButtons();
    if (state === t('否') || state === t('禁用')) {
      enableAllButtons();
      return;
    } else if (state === t('審核')) {
      try{
        await meta.addCreator(address).send({from: currentAccount});
        
        const response = await axios.put(`${website}/api/update/userAccount`, null, {
          headers: headers,
          params: {
            address: address,
            state: 1
          },
        });
        alert(t('創作者驗證成功'));
        window.location.reload();
      } catch (error) {
        if (error.message.includes('User denied transaction signature')) {
          alert(t('拒绝交易'));
        } else {
          console.error('創作者驗證錯誤：', error);
          alert(error);
        }
      }
    } else if (state === t('是')) {
      setShowUser(true);
      setDeleteUser(address);
    }
    enableAllButtons();
  };

  const handleClose = () => {
    setShowUser(false);
    setDeleteUser(null);
  };

  const userDeleteConfirm = async () => {
    if (deleteUser !== null) {
      try{
        disableAllButtons();
        await meta.removeCreator(deleteUser).send({from: currentAccount});
        
        const response = await axios.put(`${website}/api/update/userAccount`, null, {
          headers: headers,
          params: {
            address: deleteUser,
            state: 3
          },
        });
        alert(t('創作者已刪除'));
        window.location.reload();
      } catch (error) {
        if (error.message.includes('User denied transaction signature')) {
          alert(t('拒绝交易'));
        } else {
          console.error('創作者刪除錯誤：', error);
          alert(error);
        }
      } finally {
        enableAllButtons();
        setShowUser(false);
        setDeleteUser(null);
      }
    }
  };

  const userSearchSubmit = async (event) => {
    event.preventDefault();
    if (userSearchTerm.trim() === '') {
      setUserSearchResults(account);
      return;
    }
    const results = account.filter(item => 
      item.address.includes(userSearchTerm)
    );
    setUserSearchResults(results);
  };

  const userSearchChange = (event) => {
    setUserSearchTerm(event.target.value);
  };

  
  return (
    <>
    {!loading && (
      <Container className="comicManagement mt-4">
        <div className="table-wrapper">
          <Tabs defaultActiveKey="admin" id="tabs" className="mb-3">
            <Tab eventKey="admin" title={t('管理員')}>
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
                      <td className="address-cell">{data}</td>
                      <td className="text-end">
                        <Button onClick={() => removeAdmin(data)} className='del-btn' variant="outline-danger" data-backgroundcolor="#0FC2C0">
                          <TrashFill title="Delete" /> <span className="del-text">{t('刪除')}</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Tab>
            <Tab eventKey="comic" title={t('漫畫')}>
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
                            onClick={() => handleShow(data)}
                            className='del-btn-comic btn'
                            variant="outline-danger"
                            data-backgroundcolor="#0FC2C0"
                            disabled={data.exists === t('盜版')}
                          >
                            {data.exists}
                          </Button>



                          <Modal
                            show={modalState.show}
                            onHide={handleHide}
                            dialogClassName="custom-modal-content"
                          >
                            <Modal.Header>
                              <Modal.Title>{modalState.isConfirm ? t('確定是盜版') : t('漫畫狀態')}</Modal.Title>
                            </Modal.Header>
                            <Modal.Body>
                              {!modalState.isConfirm && modalState.data && (
                                <Form.Label style={{fontSize: "18px"}}>
                                  {modalState.data.title}
                                </Form.Label>
                              )}
                              {modalState.isConfirm ? (
                                <Form.Label>{t('漫畫確定是盜版，刪除後將無法復原，並進行退款。')}</Form.Label>
                              ) : (
                                  renderButtons()
                              )}
                            </Modal.Body>
                            <Modal.Footer className="custom-modal-footer">
                              {modalState.isConfirm ? (
                                <>
                                  <Button onClick={handleConfirm} variant="success">
                                    {t('確定')}
                                  </Button>
                                  <Button onClick={handleHide}>
                                    {t('取消')}
                                  </Button>
                                </>
                              ) : (
                                <Button className="mt-3" onClick={handleHide}>
                                  {t('取消')}
                                </Button>
                              )}
                            </Modal.Footer>
                          </Modal>




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
            <Tab eventKey="isCreator" title={t('使用者')}>
              <Form onSubmit={userSearchSubmit} className="d-flex ms-3">
                <InputGroup>
                    <FormControl
                        placeholder={t('請輸入帳號')}
                        aria-label="Search"
                        aria-describedby="basic-addon2"
                        value={userSearchTerm}
                        onChange={userSearchChange}
                    />
                </InputGroup>
              </Form>
              <div className="table-title mt-3 mb-3 d-flex justify-content-between align-items-center">
                <h2><b>{t('使用者帳號管理')}</b></h2>
                <Search onClick={userSearchSubmit} className="comicManagement-search" />
              </div>
              <Table striped hover>
                <thead>
                  <tr>
                    <th></th>
                    <th>#</th>
                    <th>{t('帳號')}</th>
                    <th>{t('狀態')}</th>
                  </tr>
                </thead>
                <tbody>
                  {userSearchResults.map((data, index) => (
                    <tr key={index}>
                      <th></th>
                      <th>{index + 1}</th>
                      <td className="address-cell">{data.address}</td>
                      <td className="text-end">
                        <Button onClick={() => accountChange(data.address, data.is_creator)} className='del-btn' variant="outline-danger" data-backgroundcolor="#0FC2C0">
                          {data.is_creator}
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {showUser && (
                    <Modal show={showUser} onHide={handleClose} dialogClassName="custom-modal-content">
                        <Modal.Body>
                            <h3>刪除創作者帳號</h3>
                        </Modal.Body>
                        <Modal.Footer className="custom-modal-footer">
                            <Button onClick={userDeleteConfirm}>
                                確定
                            </Button>
                            <Button onClick={handleClose}>
                                取消
                            </Button>
                        </Modal.Footer>
                    </Modal>
                  )}
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

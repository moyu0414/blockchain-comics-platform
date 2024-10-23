import React, { useState, useEffect, useRef } from 'react';
import Web3 from 'web3';
import comicData from '../contracts/ComicPlatform.json';
import {  Container, Table, Button, Form, Tabs, Tab, InputGroup, FormControl, Modal, Tooltip, OverlayTrigger} from 'react-bootstrap';
import { PlusLg, TrashFill, Search } from 'react-bootstrap-icons';
import { formatDate } from '../index';
import { message } from 'antd';
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
  const [withdrawState, setWithdrawState] = useState(false);
  const withdrawRef = useRef('');
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
    0: '刪除',
    1: '查核',
    2: '盜版'
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
              is_creator: getCreatorStatus(user.is_creator),
              penName: user.penName,
              enable: user.date[0] ? formatDate(new Date(user.date[0])) : '-',  // 啟用日
              applied: user.date[1] ? formatDate(new Date(user.date[1])) : '-',  // 申請日
              approved: user.date[2] ? formatDate(new Date(user.date[2])) : '-',  // 審核通過日
              disabled: user.date[3] ? formatDate(new Date(user.date[3])) : '-',  // 禁用日
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

            let storedArray = JSON.parse(storedArrayJSON);
            setStoredArray(storedArray);
            for (let i = 0; i < storedArray.length; i++) {
              const status = statusMap[storedArray[i].is_exist];
              modifiedArray.push({
                title: storedArray[i].title,
                penName: storedArray[i].penName,
                author: storedArray[i].creator,
                hash: storedArray[i].comic_id,
                exists: status
              });
            }
            const sortedArray = modifiedArray.sort((a, b) => {
              if (a.exists === "查核") return -1;
              if (b.exists === "查核") return 1;
              if (a.exists === "盜版") return 1;
              if (b.exists === "盜版") return -1;
              return 0;
            });
            //console.log(sortedArray);
            setCurrent(sortedArray);
            setSearchResults(sortedArray);
            setLoading(false);
          } catch (error) {
            console.error(error);
          }
        } else {
          message.info(t('您並非管理者'));
          window.location.replace('/');         
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
    disableAllButtons();
    if (exists === 2) {  // 漫畫是盜版
      try{
        const response = await axios.get(`${website}/api/comicManagement/totalCost`, {
          headers: headers,
          params: {
            comicHash: comicHash
          }
        });
        const totalCost = web3Instance.utils.toWei(response.data, 'ether');
        let total = Number(web3Instance.utils.fromWei(totalCost, 'ether'));
        let balance = await web3Instance.eth.getBalance(currentAccount);
        balance = parseInt(Number(web3Instance.utils.fromWei(balance, 'ether')) * 1000) / 1000;
        if (total > balance) {
          message.info(`${t('餘額不足')}，${t('退款金額')}：${total}，${t('您持有餘額')}：${balance}`);
          return;
        }
        await meta.toggleComicExistence(comicHash, 2).send({ from: currentAccount, value: totalCost });
        await axios.put(`${website}/api/update/comicExist`, null, {
          headers: headers,
          params: {
            comicHash: comicHash,
            is_exist: 2
          },
        });
        updateComics(searchResults, comicHash);
        updateArray(searchResults, comicHash);
        message.info(t('漫畫刪除成功'));

        const creatorAccount = account.find(account => account.address === creator);
        
        if (creatorAccount.is_creator !== "禁用") {
          message.info(t('接著執行刪除創作者帳號'));
          await meta.removeCreator(creator).send({from: currentAccount});
        
          const response = await axios.put(`${website}/api/update/userAccount`, null, {
            headers: headers,
            params: {
              address: creator,
              state: 3
            },
          });
        }
        window.location.reload();
      } catch (error) {
        if (error.message.includes('User denied transaction signature')) {
          message.info(t('拒绝交易'));
        } else {
          alert(error);
        }
      } finally {
        enableAllButtons();
        handleHide();
      }
    } else if (exists === 1) {  // 漫畫審核中
        try{
          await meta.toggleComicExistence(comicHash, 1).send({ from: currentAccount });
          await axios.put(`${website}/api/update/comicExist`, null, {
            headers: headers,
            params: {
              comicHash: comicHash,
              is_exist: 1
            },
          });
          const updatedComics = searchResults.map(comic =>
            comic.hash === comicHash
              ? { ...comic, exists: '查核' }
              : comic
          );
          setSearchResults(updatedComics);
          message.info(t('漫畫查核中'));
          const updatedArray = storedArray.map(item =>
            item.comic_id === comicHash
              ? { ...item, is_exist: 1 }
              : item
          );
          const updatedArrayJSON = JSON.stringify(updatedArray);
          localStorage.setItem('comicDatas', updatedArrayJSON);
        } catch (error) {
          if (error.message.includes('User denied transaction signature')) {
            message.info(t('拒绝交易'));
          } else {
            alert(error);
          }
        } finally {
          enableAllButtons();
          handleHide();
        }
    } else {  // 漫畫存在
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
            ? { ...comic, exists: '刪除' }
            : comic
        );
        setSearchResults(updatedComics);
        message.info(t('漫畫復原成功'));
        const updatedArray = storedArray.map(item =>
          item.comic_id === comicHash
            ? { ...item, is_exist: 0 }
            : item
        );
        const updatedArrayJSON = JSON.stringify(updatedArray);
        localStorage.setItem('comicDatas', updatedArrayJSON);
      } catch (error) {
        if (error.message.includes('User denied transaction signature')) {
          message.info(t('拒绝交易'));
        } else {
          alert(error);
        }
      } finally {
        enableAllButtons();
        handleHide();
      }
    } 
  };

  const updateComics = (searchResults, comicHash) => {
    const targetComic = searchResults.find(comic => comic.hash === comicHash);
    const targetAuthor = targetComic.author;
    const updatedComics = searchResults.map(comic => {
      if (comic.hash === comicHash) {
        return { ...comic, exists: '盜版' };
      }
      if (comic.author === targetAuthor) {
        return { ...comic, exists: '查核' };
      }
      return comic;
    });
    setSearchResults(updatedComics);
  };

  const updateArray = (searchResults, comicHash) => {
    const targetComic = searchResults.find(comic => comic.hash === comicHash);
    const targetAuthor = targetComic.author;
    const updatedArray = searchResults.map(comic => {
      if (comic.hash === comicHash) {
        return { ...comic, exists: 2 };
      }
      if (comic.author === targetAuthor) {
        return { ...comic, exists: 1 };
      }
      return comic;
    });
    const updatedArrayJSON = JSON.stringify(updatedArray);
    localStorage.setItem('comicDatas', updatedArrayJSON);
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
      handleToggle(modalState.data.hash, 2, modalState.data.author);
    } else if (modalState.data && modalState.action === 'review') {
      handleToggle(modalState.data.hash, 1);
    }
  };

  const renderButtons = () => {
    if (!modalState.data) return null;
    const { exists, hash, creator } = modalState.data;
    switch (exists) {
      case '刪除':
        return (
          <>
            <Button className="mt-3 del-btn" onClick={() => handleShow(modalState.data, true)}>
              {t('刪除')}
            </Button>
            <Button className="mt-3 war-btn" onClick={() => handleToggle(hash, 1)}>
              {t('待查核')}
            </Button>
          </>
        );
      case '查核':
        return (
          <>
            <Button className="mt-3 return-btn" onClick={() => handleToggle(hash, 0)}>
              {t('復原')}
            </Button>
            <Button className="mt-3 del-btn" onClick={() => handleShow(modalState.data, true)}>
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

  const withdrawFees = async () => {
    if (withdrawRef.current.value > 0) {
      try{
        disableAllButtons();
        let total = await meta.getContractBalance().call({ from: currentAccount });
        total = parseInt(Number(web3Instance.utils.fromWei(total, 'ether')) * 1000) / 1000;
        if (withdrawRef.current.value > total) {
          message.info(`${t('可提領金額')}：${total}，${t('您以超過')}`);
          return;
        }
        let price = web3Instance.utils.toWei(withdrawRef.current.value, 'ether');
        await meta.withdrawFees(price).send({ from: currentAccount });
        message.info(`$ ${withdrawRef.current.value} ETH ${t('提款成功')}`);
      } catch (error) {
        if (error.message.includes('User denied transaction signature')) {
          message.info(t('拒绝交易'));
        } else {
          alert(error);
        }
      } finally {
        enableAllButtons();
        withdrawHide();
      }
    } else {
      message.info(t('請輸入提款金額'));
    };
  };

  const withdrawHide = () => {
    setWithdrawState(false);
    if (withdrawRef.current) {
      withdrawRef.current.value = '';
    }
  };

  const addAdmin = async () => {
    disableAllButtons();
    let address = web3Instance.utils.isAddress(inputValue);
    if (!address) {
      message.info(t('請輸入有效的帳號'));
      enableAllButtons();
      return;
    }
    try{
      const admins = admin.some(adminItem => adminItem === inputValue);
      if (admins == true) {
        message.info(t('此帳號已是管理者'));
      } else {
        await meta.addAdmin(inputValue).send({ from: currentAccount });
        
        const response = await axios.put(`${website}/api/update/addAdmin`, null, {
          headers: headers,
          params: {
            address: inputValue,
          },
        });
        message.info(t('管理者新增成功'));
        window.location.reload();
      }
    } catch (error) {
      if (error.message.includes('User denied transaction signature')) {
        message.info(t('拒绝交易'));
      } else {
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
        message.info(t('此帳號並非管理者，所以不用刪除'));
      } else {
        await meta.removeAdmin(address).send({ from: currentAccount });

        const response = await axios.put(`${website}/api/update/removeAdmin`, null, {
          headers: headers,
          params: {
            address: address,
          },
        });
        message.info(t('管理者刪除成功'));
        window.location.reload();
      }
    } catch (error) {
      if (error.message.includes('User denied transaction signature')) {
        message.info(t('拒绝交易'));
      } else {
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
      item.penName.includes(searchTerm) ||
      item.author.includes(searchTerm.toLowerCase()) ||
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
    if (state === '否' || state === '禁用') {
      enableAllButtons();
      return;
    } else if (state === '審核') {
      try{
        await meta.addCreator(address).send({from: currentAccount});
        
        const response = await axios.put(`${website}/api/update/userAccount`, null, {
          headers: headers,
          params: {
            address: address,
            state: 1
          },
        });
        message.info(t('創作者驗證成功'));
        window.location.reload();
      } catch (error) {
        if (error.message.includes('User denied transaction signature')) {
          message.info(t('拒绝交易'));
        } else {
          alert(error);
        }
      }
    } else if (state === '是') {
      setShowUser(true);
      setDeleteUser(address);
    }
    enableAllButtons();
  };


  const getButtonClass = (state) => {
    switch (state) {
      case '否':
        return 'cancel-btn'; // 灰色
      case '禁用':
        return 'del-btn'; // 深灰色
      case '審核':
        return 'war-btn'; // 黃色
      case '是':
        return 'pri-btn'; // 綠色
    }
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
        message.info(t('創作者已刪除'));
        window.location.reload();
      } catch (error) {
        if (error.message.includes('User denied transaction signature')) {
          message.info(t('拒绝交易'));
        } else {
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
      item.address.includes(userSearchTerm.toLowerCase()) ||
      (item.penName && item.penName.includes(userSearchTerm))
    );
    setUserSearchResults(results);
  };

  const userSearchChange = (event) => {
    setUserSearchTerm(event.target.value);
  };

  const renderTooltip = (msg) => (props) => (
    <Tooltip id="button-tooltip" {...props}>
      {msg}
    </Tooltip>
  );

  const disableAllButtons = () => {
    const buttons = document.querySelectorAll(".btn");
    buttons.forEach(button => {
      button.disabled = true;
    });
  };
  
  const enableAllButtons = () => {
    const buttons = document.querySelectorAll(".btn");
    buttons.forEach(button => {
      button.disabled = false;
    });
  };

  const showAccount = (account) => {
    const prefix = account.substr(0, 5);
    const suffix = account.substr(36, 40);
    return prefix + "..." + suffix;
  };

  
  return (
    <>
    {!loading && (
      <Container className="comicManagement mt-4">
        <div className="table-wrapper">
          <Tabs defaultActiveKey="admin" id="tabs" className="mb-3">
            <Tab eventKey="admin" title={t('管理員')}>
              <div className="table-title mb-3 d-flex justify-content-between align-items-center">
                <h2><b>{t('合約提款')}</b></h2>
                <div>
                  <Button onClick={() => setWithdrawState(true)} className='add-btn' variant="outline-danger" data-backgroundcolor="#0FC2C0">
                    <PlusLg title="Add" size={24}/> {t('提款')}
                  </Button>
                </div>
              </div>
              <Modal
                show={withdrawState}
                onHide={withdrawHide}
                dialogClassName="custom-modal-content"
              >
                <Modal.Header>
                  <Modal.Title>{t('平台提款')}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <Form>
                    <Form.Group>
                      <Form.Label>{t('請輸入價格')}</Form.Label>
                      <Form.Control
                        type="number"
                        placeholder={t('請輸入價格')}
                        min="0.001"
                        step="0.001"
                        ref={withdrawRef}
                      />
                    </Form.Group>
                  </Form>
                </Modal.Body>
                <Modal.Footer className="custom-modal-footer">
                  <Button className='pri-btn mt-3' onClick={withdrawFees}>
                    {t('確定')}
                  </Button>
                  <Button className='cancel-btn mt-3' onClick={withdrawHide}>
                    {t('取消')}
                  </Button>
                </Modal.Footer>
              </Modal>
              <hr />
              <div className="table-title mt-3 mb-3 d-flex justify-content-between align-items-center">
                <h2><b>{t('帳號管理')}</b></h2>
                <div>
                  <Button onClick={addAdmin} className='add-btn' variant="outline-danger" data-backgroundcolor="#0FC2C0">
                    <PlusLg title="Add" size={24}/> {t('新增管理員')}
                  </Button>
                </div>
              </div>
              <Form className="d-flex mb-3">
                <InputGroup>
                  <FormControl
                    placeholder={t('請輸入管理員帳號')}
                    aria-label="Search"
                    aria-describedby="basic-addon2"
                    onChange={handleInputChange}
                  />
                </InputGroup>
              </Form>
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
                      <td data-label={t('帳號')} className="address-cell">{data}</td>
                      <td data-label={t('狀態')} className="text-end">
                        <OverlayTrigger placement="top" overlay={renderTooltip(t('刪除管理者帳號'))}>
                          <Button onClick={() => removeAdmin(data)} className='trash-btn' variant="outline-danger" data-backgroundcolor="#0FC2C0">
                            <TrashFill title="Delete" /> <span className="del-text">{t('刪除')}</span>
                          </Button>
                        </OverlayTrigger>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Tab>
            <Tab eventKey="comic" title={t('漫畫')}>
              <div className="table-title mb-3 d-flex justify-content-between align-items-center">
                <h2><b>{t('管理漫畫')}</b></h2>
                <Search onClick={handleSearchSubmit} className="comicManagement-search" />
              </div>
              <Form onSubmit={handleSearchSubmit} className="d-flex mb-3">
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
                        <th data-label="ID">{index + 1}</th>
                        <td data-label={t('漫畫')}>{data.title}</td>
                        {!isMobile ? (
                          <td data-label={t('作者')}  className="address-cell">
                            {data.penName}({data.author})
                          </td>
                        ) : (
                          <td data-label={t('作者')}  className="address-cell">
                            {data.penName}（{showAccount(data.author)}）
                          </td>
                        )}
                        {!isMobile &&
                          <td data-label={t('漫畫Hash')}>
                            {data.hash}
                          </td>
                        }
                        <td data-label={t('狀態')} className="text-end">
                          <OverlayTrigger placement="top" overlay={renderTooltip(data.exists !== '盜版' ? t('修改漫畫存續狀態') : `${t('盜版漫畫已下架')}、${t('已退款')}`)}>
                            <Button
                              onClick={() => handleShow(data)}
                              className={`btn ${
                                data.exists === '刪除' ? 'del-btn' :
                                data.exists === '查核' ? 'war-btn' :
                                data.exists === '盜版' ? 'piracy' : ''
                              }`}
                              variant="outline-danger"
                              data-backgroundcolor="#0FC2C0"
                              disabled={data.exists === '盜版'}
                            >
                              {t(data.exists)}
                            </Button>
                          </OverlayTrigger>
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
                                <Form.Label>{t('漫畫確定是盜版，刪除後將無法復原，並進行退款和禁用創作者帳號。')}</Form.Label>
                              ) : (
                                  renderButtons()
                              )}
                            </Modal.Body>
                            <Modal.Footer className="custom-modal-footer">
                              {modalState.isConfirm ? (
                                <>
                                  <Button className='pri-btn' onClick={handleConfirm}>
                                    {t('確定')}
                                  </Button>
                                  <Button className='cancel-btn' onClick={handleHide}>
                                    {t('取消')}
                                  </Button>
                                </>
                              ) : (
                                <Button className="mt-3 cancel-btn" onClick={handleHide}>
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
              <div className="table-title mb-3 d-flex justify-content-between align-items-center">
                <h2><b>{t('使用者帳號管理')}</b></h2>
                <Search onClick={userSearchSubmit} className="comicManagement-search" />
              </div>
              <Form onSubmit={userSearchSubmit} className="d-flex mb-3">
                <InputGroup>
                    <FormControl
                        placeholder={t('請輸入筆名或帳號')}
                        aria-label="Search"
                        aria-describedby="basic-addon2"
                        value={userSearchTerm}
                        onChange={userSearchChange}
                    />
                </InputGroup>
              </Form>
              <Table striped hover>
                <thead>
                  <tr>
                    <th></th>
                    <th>#</th>
                    <th>{t('帳號')}</th>
                    <th>{t('啟用日')} / {t('禁用日')}</th>
                    <th>{t('申請日')}</th>
                    <th>{t('審核通過')}</th>
                    <th>{t('身分狀態')}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {userSearchResults.map((data, index) => (
                    <tr key={index}>
                      <th data-label={t('編號')}></th>
                      <th data-label={t('編號')}>{index + 1}</th>
                      <td data-label={t('帳號')} className="address-cell">
                        {!isMobile ? (
                          `${data.penName}（${data.address}）`
                        ) : (
                          `${data.penName}（${showAccount(data.address)}）`
                        )}
                      </td>
                      <td 
                        data-label={t('啟用日') + ' / ' + t('禁用日')}
                        style={{ color: data.is_creator === "禁用" ? 'red' : 'inherit' }}  
                      >
                        {data.is_creator === "禁用" ? data.disabled : data.enable}
                      </td>
                      <td data-label={t('申請日')}>{data.applied}</td>
                      <td data-label={t('審核通過')}>{data.approved}</td>
                      <td data-label={t('身分狀態')}>
                        {data.is_creator === '否' && t('一般使用者')}
                        {data.is_creator === '是' && t('創作者')}
                        {data.is_creator === '審核' && t('待審核')}
                        {data.is_creator === '禁用' && t('禁用中')}
                      </td>
                      <td className="text-end">
                        {data.is_creator === '否' && (
                          <OverlayTrigger placement="top" overlay={renderTooltip(t('非創作者'))}>
                            <Button
                              className="disabled-btn"
                              disabled 
                            >
                              {t('非創作者')}
                            </Button>
                          </OverlayTrigger>
                        )}

                        {data.is_creator === '禁用' && (
                          <OverlayTrigger placement="top" overlay={renderTooltip(t('創作者權限已禁用'))}>
                            <Button
                              className="disabled-btn"
                              disabled // 禁用按鈕
                            >
                              {t('禁用中')}
                            </Button>
                          </OverlayTrigger>
                        )}

                        {data.is_creator === '是' && (
                          <OverlayTrigger placement="top" overlay={renderTooltip(t('禁用創作者'))}>
                            <Button
                              onClick={() => accountChange(data.address, data.is_creator)}
                              className="del-btn"
                              data-backgroundcolor="#0FC2C0"
                            >
                              {t('刪除')}
                            </Button>
                          </OverlayTrigger>
                        )}

                        {data.is_creator === '審核' && (
                          <OverlayTrigger placement="top" overlay={renderTooltip(t('審核創作者申請'))}>
                            <Button
                              onClick={() => accountChange(data.address, data.is_creator)}
                              className="war-btn"
                            >
                              {t('審核')}
                            </Button>
                          </OverlayTrigger>
                        )}
                      </td>
                    </tr>
                  ))}
                  {showUser && (
                    <Modal show={showUser} onHide={handleClose} dialogClassName="custom-modal-content">
                        <Modal.Body>
                            <h3>{t('禁用創作者帳號')}</h3>
                        </Modal.Body>
                        <Modal.Footer className="custom-modal-footer">
                            <Button className='pri-btn' onClick={userDeleteConfirm}>
                                {t('確定')}
                            </Button>
                            <Button className='cancel-btn' onClick={handleClose}>
                                {t('取消')}
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

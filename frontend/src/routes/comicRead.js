import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams } from "react-router-dom";
import { Navbar, Container, Row, Col, Table, ButtonToolbar, Pagination } from 'react-bootstrap';
import { ChevronLeft, List, ChevronDoubleLeft, ChevronRight, ChevronDoubleRight } from 'react-bootstrap-icons';
import { useSwipeable } from 'react-swipeable';
import { message } from 'antd';
import comicData from '../contracts/ComicPlatform.json';
import Web3 from 'web3';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import axios from 'axios';
import { sortByTimestamp, getTransactionTimestamp, disableAllButtons, enableAllButtons, initializeWeb3 } from '../index';
const website = process.env.REACT_APP_Website;
const API_KEY = process.env.REACT_APP_API_KEY;

const ComicRead = () => {
    const [showNavbar, setShowNavbar] = useState(true);
    const [showIconBar, setShowIconBar] = useState(true);
    const lastScrollTop = useRef(0);
    const [showOverlay, setShowOverlay] = useState(false);
    const [comic, setComic] = useState([]);
    const [allChapters, setAllChapters] = useState([]);
    const [chapter, setChapter] = useState([]);
    const [splitImages, setSplitImages] = useState([]);
    const [autoMode, setAutoMode] = useState(true);
    const [pageMode, setPageMode] = useState('');
    const { comicID, chapterID } = useParams();
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [readPage, setReadPage] = useState(0);
    const itemsPerPage = 10; // 每頁顯示的章節數量
    const { t } = useTranslation();
    const storedArrayJSON = localStorage.getItem('comicDatas');
    const currentAccount = localStorage.getItem("currentAccount");
    const [readingProgress, setReadingProgress] = useState(() => {
        const savedProgress = localStorage.getItem('readingProgress');
        return savedProgress ? JSON.parse(savedProgress) : {};
    });
    const headers = {'api-key': API_KEY};
    const fetchedData = [];
    let temp = [];
    let read = [];

    const handleScroll = () => {
        const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
        if (currentScrollTop > lastScrollTop.current) {
            // 向下滚动
            setShowNavbar(false);
            setShowIconBar(false);
        } else {
            // 向上滚动
            setShowNavbar(true);
            setShowIconBar(true);
        }
        lastScrollTop.current = currentScrollTop <= 0 ? 0 : currentScrollTop;
    };

    const handleClick = () => {
        setShowNavbar(prevState => !prevState);
        setShowIconBar(prevState => !prevState);
    };

    const handleListClick = () => {
        setShowOverlay(true);
    };

    const handleCloseOverlay = () => {
        setShowOverlay(false);
    };

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);


    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const initData = async () => {
        try {
            const storedArray = JSON.parse(storedArrayJSON);
            for (var i = 0; i < storedArray.length; i++) {
              if(storedArray[i].comicID == comicID){
                temp.push(storedArray[i]);
              };
            };
            setComic(temp);
            // 本漫畫的所有章節是否購買
            try {
                const response = await axios.get(`${website}/api/comicRead`, {
                    headers: headers,
                    params: {
                        comicHash: temp[0].comic_id,
                        currentAccount: currentAccount
                    }
                });
                let records = response.data;
                sortByTimestamp(records);

                records = records.map((chapter, index) => {
                    let isBuying, creator, chapterPrice;
                    if (chapter.creator === currentAccount) {
                        isBuying = t('閱讀');
                        creator = t('您是本作品的創作者');
                        if (chapter.chapterPrice == 0) {
                            chapterPrice = t('免費');
                        } else {
                            chapterPrice = chapter.chapterPrice;
                        }
                    } else if (chapter.chapterPrice == 0) {
                        isBuying = t('閱讀');
                        creator = chapter.creator
                        chapterPrice = t('免費');
                    } else {
                        isBuying = t(chapter.isBuying);
                        creator = chapter.creator;
                        chapterPrice = chapter.chapterPrice;
                    }
                    return {
                        ...chapter,
                        chapterID: `chapter${index + 1}`,
                        isBuying,
                        creator,
                        chapterPrice
                    };
                });
                setAllChapters(records);

                for (var i = 0; i < records.length; i++) {
                    if (records[i].chapterID === chapterID && records[i].isBuying === t('閱讀')) {
                        const chapterResponse = await axios.get(`${website}/api/chapterIMG/${records[i].filename}`, { responseType: 'blob', headers });
                        const image = URL.createObjectURL(chapterResponse.data);
                        const img = new Image();
                        img.src = image;
                        img.crossOrigin = 'Anonymous'; // 避免 CORS 问题
                        await new Promise((resolve) => {
                            img.onload = resolve;
                        });
                        if (autoMode) {
                            if (img.width >= 1200) {
                                setSplitImages(processImage(img));
                                setPageMode(true);
                            } else {
                                setPageMode(false);
                            }
                        } else if (pageMode) {
                            setSplitImages(processImage(img));
                        }
                        read.push({
                            chapterTitle: records[i].chapterTitle,
                            chapterID: chapterID,
                            num: (i+1),
                            image: image
                        });
                    }
                }
                setChapter(read);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching records:', error);
            }
        } catch (error) {
            console.error('Error initializing contract:', error);
        }
    };

    useEffect(() => {
        initData();
        setReadingProgress((prevProgress) => {
            const newProgress = { ...prevProgress, [comicID]: chapterID };
            localStorage.setItem('readingProgress', JSON.stringify(newProgress));
            return newProgress;
        });
    }, [comicID, chapterID, autoMode]);

    const processImage = (img) => {
        const splitWidth = 1200;
        const numSplits = Math.ceil(img.width / splitWidth);
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const newSplitImages = [];
        for (let i = 0; i < numSplits; i++) {
            canvas.width = splitWidth;
            canvas.height = img.height;
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(img, -i * splitWidth, 0);
            const splitImageURL = canvas.toDataURL('image/png');
            newSplitImages.push({
                id: i + 1,
                image: splitImageURL,
            });
        };
        return newSplitImages;
    }

    // 章節購買 或 閱讀函數
    const handlePurchase = async (chapterId) => {
        const chapter = currentChapters[chapterId]; // 使用傳遞進來的索引值來訪問章節資料
        const operationValue = chapter.isBuying;

        if (operationValue === t('閱讀')) {
        window.location.href = `/comicRead/${comicID}/${chapter.chapterID}`;
        } else {
            try {
                disableAllButtons();
                const web3 = await initializeWeb3(t);
                if (!web3) {
                    return;
                }
                const web3Instance = new web3.eth.Contract(comicData.abi, comicData.address);
                const accounts = await web3.eth.getAccounts();
                const account = accounts[0];
                if (account) {
                    let balance = await web3.eth.getBalance(currentAccount);
                    balance = balance.toString() / 1e18;
                    let price = chapter.chapterPrice;
                    if (balance > price) {
                        const comicHash = comic[0].comic_id;
                        const chapterHash = chapter.chapterHash;
                        console.log(comicHash);
                        console.log(comic[0].creator);
                        console.log(chapterHash);
                        console.log(price);
                        price = web3.utils.toWei(price, 'ether');

                        let gasEstimate = await web3Instance.methods.purchaseChapter(comicHash, chapterHash, price/10).estimateGas({
                            from: currentAccount,
                            value: price,
                        });
                        const transaction = await web3Instance.methods.purchaseChapter(comicHash, chapterHash, gasEstimate).send({
                            from: currentAccount,
                            value: price,
                            gas: gasEstimate
                        });
                        const transactionHash = transaction.transactionHash;
                        let Timestamp = await getTransactionTimestamp(transactionHash);

                        const author = comic[0].creator
                        const formData = new FormData();
                        formData.append('hash', transactionHash);
                        formData.append('comic_id', comicHash);
                        formData.append('chapter_id', chapterHash);
                        formData.append('buyer', currentAccount);
                        formData.append('creator', author);
                        formData.append('purchase_date', Timestamp);
                        formData.append('price', chapter.chapterPrice);
                        try {
                            const response = await axios.post(`${website}/api/add/records`, formData, {
                            headers: {
                                'Content-Type': 'multipart/form-data',
                                'api-key': API_KEY
                            }
                            });
                            message.info(t('章節購買成功'));
                            const updatedChapters = [...currentChapters];
                            updatedChapters[chapterId].isBuying = t('閱讀'); // 更新章節的購買狀態
                            setAllChapters(updatedChapters);
                        } catch (error) {
                            console.error('購買紀錄添加至資料庫時發生錯誤：', error);
                        }
                    } else {
                        console.log('餘額不足');
                        message.info(t('餘額不足'));
                    }
                } else {
                    alert(t('請先登入以太坊錢包，再進行購買'));
                    return;
                }
            } catch (error) {
                if (error.message.includes('User denied transaction signature')) {
                    alert(t('拒绝交易'));
                  } else {
                    console.error('章節購買時發生錯誤：', error);
                    alert(error);
                    window.location.reload();
                  }
            } finally {
                enableAllButtons();
            }
        }
    };

    const handleClickLeft = () => {
        const total = allChapters.length.toString();
        let id = parseInt(chapterID.replace("chapter", ""), 10);
        if (total == 1) {
            message.info(t('目前只有這個章節'));
            return;
        } else if (allChapters[(id-2)]) {
            if (allChapters[(id-2)].isBuying === t('閱讀')) {
                window.location.replace(`/comicRead/${comicID}/chapter${id-1}`);
            } else {
                message.info(t('您尚未購買第幾章節', { id: id - 1 }));
                return;
            }
        } else {
            message.info(t('本章節為第一章'));
            return;
        }
    };

    const handleClickRight = () => {
        const total = allChapters.length.toString();
        let id = parseInt(chapterID.replace("chapter", ""), 10);

        if (total == 1) {
            message.info(t('目前只有這個章節'));
            return;
        } else if (allChapters[(id)]) {
            if (allChapters[(id)].isBuying === t('閱讀')) {
                window.location.replace(`/comicRead/${comicID}/chapter${id+1}`);
            } else {
                message.info(t('您尚未購買第幾章節', { id: id + 1 }));
                return;
            }
        } else {
            message.info(t('本章節為最新章'));
            return;
        }
    };

    const handlePrev = () => {
        if (readPage > 0) {
            setReadPage(readPage - 1);
        } else if (readPage == 0) {
            message.info(t('此為第一頁'));
        }
    };

    const handleNext = () => {
        if (readPage < splitImages.length - 1) {
            setReadPage(readPage + 1);
        } else if (readPage == splitImages.length-1) {
            message.info(t('本章節已閱讀完'));
        }
    };

    const swipeHandlers = useSwipeable({
        onSwipedLeft: handleNext,
        onSwipedRight: handlePrev,
        preventDefaultTouchmoveEvent: true,
        trackMouse: true,
    });

    const toggleMode = () => {
        setPageMode((prevMode) => !prevMode);
        setAutoMode(false);
    };
    
    const totalPages = Math.ceil(allChapters.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentChapters = allChapters.slice(startIndex, startIndex + itemsPerPage);

    const getPageItems = () => {
        const pageItems = [];
        const maxPagesToShow = 5; // 顯示的最大頁碼數量
    
        if (totalPages <= maxPagesToShow) {
            // 如果總頁數小於等於最大顯示頁碼數，則顯示所有頁碼
            for (let i = 1; i <= totalPages; i++) {
                pageItems.push(
                    <Pagination.Item key={i} active={i === currentPage} onClick={() => handlePageChange(i)}>
                        {i}
                    </Pagination.Item>
                );
            }
        } else {
            // 計算中間的頁碼範圍
            const middlePages = Math.floor(maxPagesToShow / 2);
            let startPage = Math.max(2, currentPage - middlePages);
            let endPage = Math.min(totalPages - 1, currentPage + middlePages);
    
            if (currentPage - startPage <= middlePages) {
                endPage = Math.min(totalPages - 1, startPage + maxPagesToShow - 2);
            }
    
            if (endPage - currentPage <= middlePages) {
                startPage = Math.max(2, endPage - maxPagesToShow + 2);
            }
    
            // 第一頁
            pageItems.push(
                <Pagination.Item key={1} active={currentPage === 1} onClick={() => handlePageChange(1)}>
                    1
                </Pagination.Item>
            );
    
            if (startPage > 2) {
                pageItems.push(<Pagination.Ellipsis key="ellipsis-start" />);
            }
    
            // 中間的頁碼
            for (let i = startPage; i <= endPage; i++) {
                pageItems.push(
                    <Pagination.Item key={i} active={i === currentPage} onClick={() => handlePageChange(i)}>
                        {i}
                    </Pagination.Item>
                );
            }
    
            if (endPage < totalPages - 1) {
                pageItems.push(<Pagination.Ellipsis key="ellipsis-end" />);
            }
    
            // 最後一頁
            pageItems.push(
                <Pagination.Item key={totalPages} active={currentPage === totalPages} onClick={() => handlePageChange(totalPages)}>
                    {totalPages}
                </Pagination.Item>
            );
        }
    
        return pageItems;
    };

    useEffect(() => {
        // 設置頁面特定的 padding-bottom
        document.body.classList.add('no-padding-bottom');
        return () => {
          // 清除特定頁面的 padding-bottom
        document.body.classList.remove('no-padding-bottom');
        };
    }, []);


    


    return (
        <>
        {!loading && (
            <>
                <div className='comicRead no-padding-bottom'>
                    <Navbar className={`comic-custom-navbar ${showNavbar ? 'show' : 'hide'}`} expand="lg">
                        <Navbar.Brand className="navbar-left">
                            <Link to={`/comicDetail/${comicID}`}>
                                <ChevronLeft className="icon" size={36} />
                            </Link>
                        </Navbar.Brand>
                        <div className="navbar-center">
                            {t('第幾章', { chapter: chapter[0]?.num })}： {chapter[0]?.chapterTitle}
                        </div>
                        <div className="navbar-right">
                            <List className="icon" size={36} onClick={handleListClick} />
                        </div>
                    </Navbar>
                    {pageMode ? (
                        splitImages.length > 0 && (
                            <div
                                className="flip-comic"
                                {...swipeHandlers}
                                onClick={handleClick}
                            >
                                <img
                                    key={splitImages[readPage].id}
                                    src={splitImages[readPage].image}
                                    alt="Page comics"
                                    className="split-image active"
                                    style={{ zIndex: 2 }}
                                />
                            </div>
                        )
                    ) : (
                        chapter.map((chapter, index) => (
                            <div key={index} onClick={handleClick} className="banner-image">
                                <img src={chapter.image} alt="Long Banner" />
                            </div>
                        ))
                    )}
                    <div className={`icon-bar ${showIconBar ? 'show' : 'hide'}`}>
                        <ChevronDoubleLeft onClick={handleClickLeft} className="icon" />
                        {pageMode ? (
                            <>
                                <ChevronLeft className="icon" onClick={handlePrev} disabled={readPage === 0} />
                                <ChevronRight className="icon" onClick={handleNext} disabled={readPage === splitImages.length - 1}/>
                            </>
                        ) : (
                            <div style={{marginRight: "100px"}}></div>
                        )}
                        <ChevronDoubleRight onClick={handleClickRight} className="icon" />
                    </div>
        
                    {showOverlay && (
                        <div className=" comic-overlay">
                            <div className="overlay-content">
                                <div className="overlay-header">
                                    <div className="overlay-comic-title">{currentChapters[0]?.comicTitle}</div>
                                    <div className="overlay-author-title">{currentChapters[0]?.creator}</div>
                                    <button className="overlay-close" onClick={handleCloseOverlay}>✕</button>
                                    <button onClick={toggleMode} className="toggleMode-button">
                                        {t('切換模式：')}{pageMode ? t('條漫') : t('頁漫')}
                                    </button>
                                </div>
                                <div className="overlay-divider"></div>
                                <div className="overlay-body">
                                    <Row className='justify-content-center'>
                                        <Col className='d-flex justify-content-center chapter-table'>
                                            <Table size="sm">
                                                <tbody>
                                                    {currentChapters.map((chapter, index) => (
                                                        <tr key={index}>
                                                            <td className='text-center fw-bold'>{t('第幾章', { chapter: startIndex + index + 1 })}</td>
                                                            <td className='text-center'>{chapter.chapterTitle}</td>
                                                            <td className='text-center'>{chapter.chapterPrice}</td>
                                                            <td className='text-center'>
                                                                <button onClick={() => handlePurchase(index)} className={`btn ${chapter.isBuying === t('閱讀') ? 'read-button' : 'buy-button'}`} value={chapter.isBuying}>{chapter.isBuying}</button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        </Col>
                                    </Row>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </>
        )}
    
        {loading &&  
            <div className="loading-container">
                <div>{t('頁面加載中')}</div>
            </div>
        }
        </>
    );
};

export default ComicRead;

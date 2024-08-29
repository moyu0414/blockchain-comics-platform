import React, { useState, useEffect } from 'react';
import { Link, useParams } from "react-router-dom";
import { Container, Row, Col, Button,Navbar, Pagination } from 'react-bootstrap';
import { ChevronLeft, List, ChevronDoubleLeft, ChevronRight, ChevronDoubleRight } from 'react-bootstrap-icons';
import { useSwipeable } from 'react-swipeable';
import comicData from '../contracts/ComicPlatform.json';
import Web3 from 'web3';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import axios from 'axios';
import { sortByTimestamp, getTransactionTimestamp, disableAllButtons, enableAllButtons, initializeWeb3 } from '../index';
const website = process.env.REACT_APP_Website;
const API_KEY = process.env.REACT_APP_API_KEY;

const comics = [
    { id: 1, src: 'https://images.pexels.com/photos/7809122/pexels-photo-7809122.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', alt: 'Page 1' },
    { id: 2, src: 'https://images.pexels.com/photos/7768663/pexels-photo-7768663.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', alt: 'Page 2' },
    { id: 3, src: 'https://images.pexels.com/photos/4110344/pexels-photo-4110344.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', alt: 'Page 3' },
];

const ComicFlipRead = () => {
    const [showNavbar, setShowNavbar] = useState(true);
    const [showIconBar, setShowIconBar] = useState(true);
    const [lastScrollTop, setLastScrollTop] = useState(0);
    const [showOverlay, setShowOverlay] = useState(false);
    const [comic, setComic] = useState([]);
    const [allChapters, setAllChapters] = useState([]);
    const [chapter, setChapter] = useState([]);
    const { comicID, chapterID } = useParams();
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
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

    const handleNext = () => {
        if (currentPage < comics.length - 1) {
        setCurrentPage(currentPage + 1);
        }
    };

    const handlePrev = () => {
        if (currentPage > 0) {
        setCurrentPage(currentPage - 1);
        }
    };

    const swipeHandlers = useSwipeable({
        onSwipedLeft: handleNext,
        onSwipedRight: handlePrev,
        preventDefaultTouchmoveEvent: true,
        trackMouse: true,
    });

    const handleScroll = () => {
        const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
        if (currentScrollTop > lastScrollTop) {
            // 向下滾動
            setShowNavbar(false);
            setShowIconBar(false);
        } else {
            // 向上滾動
            setShowNavbar(true);
            setShowIconBar(true);
        }
        setLastScrollTop(currentScrollTop <= 0 ? 0 : currentScrollTop);
    };

    const handleClick = () => {
        setShowNavbar(true);
        setShowIconBar(true);
    };

    const handleListClick = () => {
        setShowOverlay(true);
    };

    const handleCloseOverlay = () => {
        setShowOverlay(false);
    };

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        window.addEventListener('click', handleClick);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('click', handleClick);
        };
    }, [lastScrollTop]);

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
            console.log(temp);
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
                console.log(records);

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
                console.log(records);
                setAllChapters(records);

                for (var i = 0; i < records.length; i++) {
                    if (records[i].chapterID === chapterID && records[i].isBuying === t('閱讀')) {
                        const chapterResponse = await axios.get(`${website}/api/chapterIMG/${records[i].filename}`, { responseType: 'blob', headers });
                        const image = URL.createObjectURL(chapterResponse.data);
                        read.push({
                        chapterTitle: records[i].chapterTitle,
                        chapterID: chapterID,
                        num: (i+1),
                        image: image
                        });
                    }
                }
                console.log(read);
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
    }, [comicID, chapterID]);

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
                            alert(t('章節購買成功'));
                            const updatedChapters = [...currentChapters];
                            updatedChapters[chapterId].isBuying = t('閱讀'); // 更新章節的購買狀態
                            setAllChapters(updatedChapters);
                        } catch (error) {
                            console.error('購買紀錄添加至資料庫時發生錯誤：', error);
                        }
                    } else {
                        console.log('餘額不足');
                        alert(t('餘額不足'));
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

    const handleClickLeft = () => {
        const total = allChapters.length.toString();
        let id = parseInt(chapterID.replace("chapter", ""), 10);
        if (total == 1) {
            alert(t('目前只有這個章節'));
            return;
        } else if (allChapters[(id-2)]) {
            if (allChapters[(id-2)].isBuying === t('閱讀')) {
                window.location.replace(`/comicRead/${comicID}/chapter${id-1}`);
            } else {
                alert(t('您尚未購買第幾章節', { id: id - 1 }));
                return;
            }
        } else {
            alert(t('本章節為第一章'));
            return;
        }
    };

    const handleClickRight = () => {
        const total = allChapters.length.toString();
        let id = parseInt(chapterID.replace("chapter", ""), 10);

        if (total == 1) {
            alert(t('目前只有這個章節'));
            return;
        } else if (allChapters[(id)]) {
            if (allChapters[(id)].isBuying === t('閱讀')) {
                window.location.replace(`/comicRead/${comicID}/chapter${id+1}`);
            } else {
                alert(t('您尚未購買第幾章節', { id: id + 1 }));
                return;
            }
        } else {
            alert(t('本章節為最新章'));
            return;
        }
    };

    return (
        <Container fluid className="comicFlipRead text-center">
        <Navbar className={`comic-custom-navbar ${showNavbar ? 'show' : 'hide'}`} expand="lg">
            <Navbar.Brand className="navbar-left">
                <Link to={`/comicDetail/${comicID}`}>
                    <ChevronLeft className="icon" size={36} />
                </Link>
            </Navbar.Brand>
            <Navbar.Brand className="navbar-center">
                {t('第幾章', { chapter: chapter[0]?.num })}： {chapter[0]?.chapterTitle}
            </Navbar.Brand>
            <div className="navbar-right">
                <List className="icon" size={36} onClick={handleListClick} />
            </div>
        </Navbar>
        {chapter.map((chapter, index) => (
            <div key={index} className="banner-image">
                <img src={chapter.image} alt="Long Banner" />
            </div>
        ))}
        <div className={`icon-bar ${showIconBar ? 'show' : 'hide'}`}>
            <ChevronDoubleLeft onClick={handleClickLeft} className="icon" />
            <ChevronLeft className="icon" onClick={handlePrev} disabled={currentPage === 0} />
            <ChevronRight className="icon" onClick={handleNext} disabled={currentPage === comics.length - 1}/>
            <ChevronDoubleRight onClick={handleClickRight} className="icon" />
        </div>
        <Row className="justify-content-center">
            <Col
                xs={12}
                className="comic-container"
                {...swipeHandlers}
                >
                {comics.map((comic, index) => (
                    <img
                    key={comic.id}
                    src={comic.src}
                    alt={comic.alt}
                    className={`img-fluid comic-page ${
                        index === currentPage ? 'active' : ''
                    }`}
                    style={{ zIndex: index === currentPage ? 2 : 1 }}
                    />
                ))}
            </Col>
        </Row>
        </Container>
    );
};

export default ComicFlipRead;
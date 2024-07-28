import React, { useState, useEffect } from 'react';
import { Link, useParams } from "react-router-dom";
import { Navbar, Container, Row, Col, Table, ButtonToolbar, Pagination } from 'react-bootstrap';
import { ChevronLeft, List, ChevronDoubleLeft, ChevronRight, ChevronDoubleRight } from 'react-bootstrap-icons';
import comicData from '../contracts/ComicPlatform.json';
import Web3 from 'web3';
import axios from 'axios';
import { sortByTimestamp, getTransactionTimestamp, disableAllButtons, enableAllButtons } from '../index';

const ComicRead = () => {
    const [web3, setWeb3] = useState(null);
    const [web3Instance, setWeb3Instance] = useState(''); 
    const [showNavbar, setShowNavbar] = useState(true);
    const [showIconBar, setShowIconBar] = useState(true);
    const [lastScrollTop, setLastScrollTop] = useState(0);
    const [showOverlay, setShowOverlay] = useState(false);
    const [comic, setComic] = useState([]);
    const [similComic, setSimilComic] = useState([]);
    const [allChapters, setAllChapters] = useState([]);
    const [chapter, setChapter] = useState([]);
    const { comicID, chapterID } = useParams();
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; // 每頁顯示的章節數量
    const storedArrayJSON = localStorage.getItem('comicDatas');
    const currentAccount = localStorage.getItem("currentAccount");
    const fetchedData = [];
    let temp = [];
    let read = [];

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
            const web3 = new Web3(window.ethereum);
            setWeb3(web3);
            const contractInstance = new web3.eth.Contract(comicData.abi, comicData.address);
            setWeb3Instance(contractInstance);

            const storedArray = JSON.parse(storedArrayJSON);
            for (var i = 0; i < storedArray.length; i++) {
              if(storedArray[i].comicID == comicID){
                temp.push(storedArray[i]);
              };
            };
            setComic(temp);
            //console.log(temp);
            // 本漫畫的所有章節是否購買
            try {
                const response = await axios.get('http://localhost:5000/api/comicRead', {
                    params: {
                    comicHash: temp[0].comicHash,
                    currentAccount: currentAccount
                    }
                });
                let records = response.data;
                sortByTimestamp(records);
                //console.log(records);

                records = records.map((chapter, index) => {
                    let isBuying;
                    if (chapter.creator === currentAccount) {
                        isBuying = '閱讀';
                    } else {
                        isBuying = chapter.isBuying
                    }
                    return {
                        ...chapter,
                        chapterID: `chapter${index + 1}`,
                        isBuying
                    };
                });
                console.log(records);
                setAllChapters(records);

                for (var i = 0; i < records.length; i++) {
                    if (records[i].chapterID === chapterID && records[i].isBuying === '閱讀') {
                        let url = "http://localhost:5000/api/chapterIMG/" + records[i].filename;
                        read.push({
                        chapterTitle: records[i].chapterTitle,
                        chapterID: chapterID,
                        num: (i+1),
                        image: url
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
    }, [comicID, chapterID]);

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

    // 章節購買 或 閱讀函數
    const handlePurchase = async (chapterId) => {
        const chapter = currentChapters[chapterId]; // 使用傳遞進來的索引值來訪問章節資料
        const operationValue = chapter.isBuying;

        if (operationValue === '閱讀') {
        window.location.href = `/comicRead/${comicID}/${chapter.chapterID}`;
        } else {
        try {
            disableAllButtons();
            let balance = await web3.eth.getBalance(currentAccount);
            balance = balance.toString() / 1e18;
            let price = chapter.chapterPrice;
            if (balance > price) {
                const comicHash = comic[0].comicHash;
                const chapterHash = chapter.chapterHash;
                console.log(comicHash);
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

                const author = comic[0].author === '您是本作品的創作者!' ? currentAccount : comic[0].author;
                const formData = new FormData();
                formData.append('hash', transactionHash);
                formData.append('comic_id', comicHash);
                formData.append('chapter_id', chapterHash);
                formData.append('buyer', currentAccount);
                formData.append('creator', author);
                formData.append('purchase_date', Timestamp);
                formData.append('price', chapter.chapterPrice);
                try {
                    const response = await axios.post('http://localhost:5000/api/add/records', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                    });
                    alert('章節購買成功！');
                    const updatedChapters = [...currentChapters];
                    updatedChapters[chapterId].isBuying = '閱讀'; // 更新章節的購買狀態
                    setAllChapters(updatedChapters);
                } catch (error) {
                    console.error('購買紀錄添加至資料庫時發生錯誤：', error);
                }
            } else {
                console.log('餘額不足');
                alert('餘額不足');
            }
        } catch (error) {
            console.error('章節購買時發生錯誤：', error);
            alert(error);
            window.location.reload();
        } finally {
            enableAllButtons();
        }
        }
    };


    return (
        <>
        {!loading && (
            <>
                <Navbar className={`comic-custom-navbar ${showNavbar ? 'show' : 'hide'}`} expand="lg">
                    <Navbar.Brand href="#" className="navbar-left">
                        <Link to={`/comicDetail/${comicID}`}>
                            <ChevronLeft className="icon" size={36} />
                        </Link>
                    </Navbar.Brand>
                    <Navbar.Brand className="navbar-center">
                        第{chapter[0]?.num}章： {chapter[0]?.chapterTitle}
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
                    <ChevronDoubleLeft className="icon" />
                    <ChevronLeft className="icon" />
                    <ChevronRight className="icon" />
                    <ChevronDoubleRight className="icon" />
                </div>

                {showOverlay && (
                    <div className="comic-overlay">
                        <div className="overlay-content">
                            <div className="overlay-header">
                                <div className="overlay-comic-title">{currentChapters[0]?.comicTitle}</div>
                                <div className="overlay-author-title">{currentChapters[0]?.creator}</div>
                                <button className="overlay-close" onClick={handleCloseOverlay}>✕</button>
                            </div>
                            <div className="overlay-divider"></div>
                            <div className="overlay-body">
                                <Row className='justify-content-center'>
                                    <Col className='d-flex justify-content-center chapter-table'>
                                        <Table size="sm">
                                            <tbody>
                                                {currentChapters.map((chapter, index) => (
                                                    <tr key={index}>
                                                        <td className='text-center fw-bold'>第 {startIndex + index + 1} 章</td>
                                                        <td className='text-center'>{chapter.chapterTitle}</td>
                                                        <td className='text-center'>
                                                            <button onClick={() => handlePurchase(index)} className="btn">{chapter.isBuying}</button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </Col>
                                </Row>
                                <Row className='pt-2 pb-5 justify-content-center table-button'>
                                    <Col className='d-flex justify-content-center'>
                                        <ButtonToolbar aria-label="Toolbar with pagination">
                                            <Pagination>
                                                <Pagination.Prev 
                                                    onClick={() => handlePageChange(currentPage - 1)} 
                                                    disabled={currentPage <= 1} 
                                                    className='pagination-button'
                                                />
                                                {getPageItems()}
                                                <Pagination.Next 
                                                    onClick={() => handlePageChange(currentPage + 1)} 
                                                    disabled={currentPage >= totalPages} 
                                                    className='pagination-button'
                                                />
                                            </Pagination>
                                        </ButtonToolbar>
                                    </Col>
                                </Row>
                            </div>
                        </div>
                    </div>
                )}
            </>
        )}

        {loading &&  
            <div className="loading-container">
                <div>頁面加載中，請稍後...</div>
            </div>
        }
    </>
    );
};

export default ComicRead;

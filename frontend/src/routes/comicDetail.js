import React, { useState, useEffect } from 'react';
import { Link, useParams } from "react-router-dom";
import { Container, Card, Col, Row, Button, Table, ButtonToolbar, Pagination, Tooltip, OverlayTrigger } from 'react-bootstrap';
import './bootstrap.min.css';
import { Heart, HeartFill, CardImage } from 'react-bootstrap-icons';
import comicData from '../contracts/ComicPlatform.json';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import axios from 'axios';
import { sortByTimestamp, getTransactionTimestamp, formatDate, disableAllButtons, enableAllButtons, initializeWeb3 } from '../index';
const website = process.env.REACT_APP_Website;
const API_KEY = process.env.REACT_APP_API_KEY;

function ComicDetail() {
    const [comic, setComic] = useState([]);
    const [similComic, setSimilComic] = useState([]);
    const [chapters, setChapters] = useState([]);
    const { comicID } = useParams();
    const [loading, setLoading] = useState(true);
    const [isFavorited, setIsFavorited] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [piracy, setPiracy] = useState([]);
    const { t } = useTranslation();
    const storedArrayJSON = localStorage.getItem('comicDatas');
    const currentAccount = localStorage.getItem("currentAccount");
    const headers = {'api-key': API_KEY};
    const fetchedData = [];
    const buttonData = [
        t('開始閱讀'), t('收藏')
    ];
    let temp = [];
    let chapterInfo = [];

    const initData = async () => {
        try {
            const storedArray = JSON.parse(storedArrayJSON); // 假设 storedArrayJSON 是一个 JSON 字符串
            for (let i = 0; i < storedArray.length; i++) {
                if (storedArray[i].is_exist === 0) {
                    if (storedArray[i].comicID === comicID) {
                        const filename = storedArray[i].filename;
                        let protoFilename;
                        if (storedArray[i].protoFilename) {
                            const protoResponse = await axios.get(`${website}/api/coverFile/${filename}/${storedArray[i].protoFilename}`, { responseType: 'blob', headers });
                            protoFilename = URL.createObjectURL(protoResponse.data); 
                        } else {
                            const imageResponse = await axios.get(`${website}/api/comicIMG/${filename}`, { responseType: 'blob', headers });
                            protoFilename = URL.createObjectURL(imageResponse.data);
                        }
                        let author;
                        if (storedArray[i].creator == currentAccount) {
                            author = t('您是本作品的創作者');
                        } else {
                            author = storedArray[i].creator;
                        }
                        temp.push({
                            comicHash: storedArray[i].comic_id,
                            comicID: storedArray[i].comicID,
                            title: storedArray[i].title,
                            description: storedArray[i].description,
                            author: author,
                            penName: storedArray[i].penName,
                            category: storedArray[i].category,
                            protoFilename: protoFilename,
                            release: storedArray[i].date
                        });
                    }
                }
            }
            if (temp.length !== 0){
                console.log(temp);
                setComic(temp);

                for (let i = 0; i < storedArray.length; i++) {
                    // 類似漫畫 依據類型跟同作者取前4本
                    if ((storedArray[i].category == temp[0].category || storedArray[i].creator == temp[0].author) && storedArray[i].comicID != comicID && storedArray[i].is_exist === 0) {
                        const imageResponse = await axios.get(`${website}/api/comicIMG/${storedArray[i].filename}`, { responseType: 'blob', headers });
                        const image = URL.createObjectURL(imageResponse.data);
                        fetchedData.push({
                            comicID: storedArray[i].comicID,
                            title: storedArray[i].title,
                            description: storedArray[i].description,
                            penName: storedArray[i].penName,
                            category: storedArray[i].category,
                            image: image,
                            date: storedArray[i].date
                        });
                    }
                    if (fetchedData.length == 4) {
                        break;
                    }
                }
                setSimilComic(fetchedData);
    
                // 章節購買者
                try {
                    const response = await axios.get(`${website}/api/comicDetail`, {
                        headers: headers,
                        params: {
                            comicHash: temp[0].comicHash,
                            currentAccount: currentAccount
                        }
                    });
                    let chapters = response.data;
                    sortByTimestamp(chapters);
                    console.log(chapters);
    
                    chapters = chapters.map((chapter, index) => {
                        let isBuying, price;
                        if (chapter.creator === currentAccount || chapter.isBuying !== null || chapter.price == 0) {
                            isBuying = t('閱讀');
                            price = chapter.price == 0 ? t('免費') : chapter.price;
                        } else {
                            isBuying = t('購買');
                            price = chapter.price;
                        }
                        return {
                            ...chapter,
                            chapterID: `chapter${index + 1}`,
                            isBuying,
                            price
                        };
                    });
                    console.log(chapters);
                    setChapters(chapters);
    
                    let lastChapterInfo = chapters[chapters.length - 1];
                    let updatedComic = temp.map(comic => {
                        return {...comic, chapter: lastChapterInfo.title, date: formatDate(new Date(Number(lastChapterInfo.create_timestamp)))};
                    });
                    console.log(updatedComic);
                    setComic(updatedComic);
                } catch (error) {
                    console.error('Error fetching records:', error);
                }
    
                // 資料庫查詢收藏狀態
                try {
                    const response = await axios.get(`${website}/api/comicDetail/isFavorited`, {
                        headers: headers,
                        params: {
                            currentAccount: currentAccount,
                            comicHash: temp[0].comicHash
                        }
                    });
                    //console.log(response.data.isFavorited);
                    setIsFavorited(response.data.isFavorited);
                } catch (error) {
                    console.error('Error fetching records:', error);
                }
            } else {
                const temp = storedArray
                    .filter(item => item.comicID === comicID)
                    .map(item => ({
                    title: item.title,
                    description: item.description,
                    author: item.creator,
                    penName: item.penName,
                    state: item.is_exist === 2 ? "盜版漫畫，已下架，已退款" : "漫畫查核中，暫不開放，敬請見諒"
                    }));
                setComic(temp);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error initializing comic:', error);
        }
    };

    useEffect(() => {
        initData();
    }, [comicID]);

    const handleFavoriteClick = async () => {
        const web3 = await initializeWeb3(t);
        if (!web3) {
            return;
        }
        const web3Instance = new web3.eth.Contract(comicData.abi, comicData.address);
        const accounts = await web3.eth.getAccounts();
        if (accounts[0]) {
            setIsFavorited(!isFavorited); // 切換收藏狀態
            let data = chapters[chapters.length-1].create_timestamp;
            try {
                const response = await axios.put(`${website}/api/update/comicDetail/favorite`, null, {
                    headers: headers,
                    params: {
                        currentAccount: currentAccount,
                        comicHash: comic[0].comicHash,
                        bool: !isFavorited,
                        data: data
                    },
                });
            } catch (error) {
                console.error('Error handleFavoriteClick', error);
            }
        } else {
            alert(t('請先登入以太坊錢包，才可以收藏'));
            return;
        }
    };

    const handleReadClick = async () => {
        const reading = chapters.find(chapter => chapter.isBuying === t('閱讀'));
        if (reading) {
            const readingProgress = localStorage.getItem("readingProgress");
            const readingArray = readingProgress ? JSON.parse(readingProgress) : {};
            const exists = chapters.some(chapter => chapter.isBuying === t('閱讀') && chapter.chapterID === readingArray[comicID]);
            if (comicID in readingArray && exists === true) {  // 有購買紀錄
                window.location.replace(`/comicRead/${comicID}/${readingArray[comicID]}`);
            } else {  // 免費閱讀
                window.location.replace(`/comicRead/${comicID}/${reading.chapterID}`);
            }
        } else {
            alert(`${comic[0].title} ${t('沒有提供免費試讀')}`);
        }
    };

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
                let price = chapter.price;
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
    
                    const formData = new FormData();
                    formData.append('hash', transactionHash);
                    formData.append('comic_id', comicHash);
                    formData.append('chapter_id', chapterHash);
                    formData.append('buyer', currentAccount);
                    formData.append('purchase_date', Timestamp);
                    formData.append('price', chapter.price);
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
                        setChapters(updatedChapters);
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

    const itemsPerPage = 10; // 每頁顯示的章節數量
    const totalPages = Math.ceil(chapters.length / itemsPerPage);

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    // 計算當前頁面的章節切片的起始索引
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentChapters = chapters.slice(startIndex, startIndex + itemsPerPage);

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

    const renderTooltip = (description) => (props) => (
        <Tooltip id="button-tooltip" {...props}>
            {description}
        </Tooltip>
    );


    return (
        <>
            {!loading && (
                <Container className='comicDetail'>
                    <Row className="pt-5">
                        <div className="d-block mx-auto img-fluid carousel-image-container">
                            {comic[0].state ? (
                                <div className='remove-section' style={{ display: 'flex', flexDirection: 'column' }}>
                                    {/* <div id="start" style={{ display: 'block'}}> */}
                                        <img src='/piratyPromo.jpg' />
                                        <div id="notimage" className="hidden">{t(comic[0].state)}</div>
                                    {/* </div> */}
                                </div>
                            ) : (
                                <img
                                    className="d-block mx-auto img-fluid"
                                    src={comic[0].protoFilename}
                                    alt="800x400"
                                />
                            )}
                        </div>
                    </Row>
                    <Row className="pt-3 pb-3 btn-container justify-content-center">
                        {buttonData.map((label, idx) => (
                            <Col key={idx} xs={2} md={2} lg={2} className="pb-3 btn-section d-flex justify-content-center">
                                <Button 
                                    variant="outline-dark"
                                    className="custom-button"
                                    onClick={label === t('收藏') ? handleFavoriteClick : handleReadClick}
                                    data-backgroundcolor="#fff"
                                    disabled={comic[0].state ? true : false}
                                >
                                    {label === t('收藏') && (
                                        <>
                                            {isFavorited ? (
                                                <HeartFill
                                                    className="me-2"
                                                    style={{ color: '#F6B93B', cursor: 'pointer' }}
                                                    size={20}
                                                />
                                            ) : (
                                                <Heart
                                                    className="me-2"
                                                    style={{ color: 'black', cursor: 'pointer' }}
                                                    size={20}
                                                />
                                            )}
                                        </>
                                    )}
                                    {label}
                                </Button>
                            </Col>
                        ))}
                    </Row>
                    <Row>
                        <Col className="text-section">
                            {comic.map((comic, index) => (
                                <React.Fragment key={index}>
                                    <h3 className="fw-bold">{comic.title}</h3>
                                    <Link to={`/authorProfile/${comic.author === t('您是本作品的創作者') ? currentAccount : comic.author}`}>
                                        <p>
                                            <span className="comicDetail-penName">{comic.penName}</span> 
                                            <span className="address">({comic.author})</span>
                                        </p>
                                    </Link>
                                    <p>{t('發布日期')}：{comic.release}</p>
                                    <p>{t('最新章節')}：{comic.chapter}<span className="text-secondary">...{comic.date}</span></p>
                                    <p className="text-secondary">{comic.description}</p>
                                </React.Fragment>
                            ))}
                        </Col>
                    </Row>
                    <Row className='pt-5 chapter-title-section'>
                        <Col>
                            <div className='d-flex justify-content-between align-items-center'>
                                <h3 className='fw-bold mb-0'>{t('章節目錄')}</h3>
                                <p className='text-end mb-0'>{t('查看全部章節')}</p>
                            </div>
                            <hr />
                        </Col>
                    </Row>
                    <Row className='justify-content-center'>
                        <Col className='d-flex justify-content-center chapter-table'>
                            <Table size="sm">
                                <tbody>
                                    {currentChapters.map((chapter, index) => (
                                        <tr key={index}>
                                            <td className='text-center fw-bold'>{t('第幾章', { chapter: startIndex + index + 1 })}</td>
                                            <td className='text-center'>{chapter.title}</td>
                                            <td className='text-center'>{chapter.price}</td>
                                            <td className='text-center'>
                                                <button onClick={() => handlePurchase(index)} className={`btn ${chapter.isBuying === t('閱讀') ? 'read-button' : 'buy-button'}`} value={chapter.isBuying}>{chapter.isBuying}</button>
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
                                        onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage <= 1} 
                                        className='pagination-button'
                                    />
                                    {getPageItems()}
                                    <Pagination.Next 
                                        onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages} 
                                        className='pagination-button'
                                    />
                                </Pagination>
                            </ButtonToolbar>
                        </Col>
                    </Row>
                    <Row>
                        <h3 className="fw-bold">{t('類似漫畫')}</h3>
                    </Row>
                    <Row xs={1} md={2} className="g-4 pb-5">
                        {similComic.map((data, idx) => (
                            <Col key={idx} xs={6} md={3} className="pt-3">
                                <Link to={`/comicDetail/${data.comicID}`}>
                                    <Card className="ranking-thumbnail-position">
                                        <OverlayTrigger placement="top" overlay={renderTooltip(data.description)}>
                                            <Card.Img variant="top" src={data.image} />
                                        </OverlayTrigger>
                                        <div className="comicDetail-createTime" style={{marginBottom: "0px"}}>{data.penName}</div>
                                        <div className="comicDetail-createTime">{data.date}</div>
                                        <Card.Body>
                                            <Card.Title className='text-center'>{data.title}</Card.Title>
                                            <Card.Text className="comicDetail-text">{data.description}</Card.Text>
                                        </Card.Body>
                                    </Card>
                                </Link>
                            </Col>
                        ))}
                    </Row>
                </Container>
            )}
            {loading && (
                <div className="loading-container">
                    <div>{t('頁面加載中')}</div>
                </div>
            )}
        </>
    );
}

export default ComicDetail;

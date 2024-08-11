import React, { useState, useEffect } from 'react';
import { Link, useParams } from "react-router-dom";
import { Container, Card, Col, Row, Button, Table, ButtonToolbar, Pagination } from 'react-bootstrap';
import './bootstrap.min.css';
import { Heart, HeartFill } from 'react-bootstrap-icons';
import comicData from '../contracts/ComicPlatform.json';
import Web3 from 'web3';
import axios from 'axios';
import { sortByTimestamp, getTransactionTimestamp, disableAllButtons, enableAllButtons } from '../index';
const website = process.env.REACT_APP_Website;

function ComicDetail() {
    const [web3, setWeb3] = useState(null);
    const [web3Instance, setWeb3Instance] = useState('');
    const [comic, setComic] = useState([]);
    const [similComic, setSimilComic] = useState([]);
    const [chapters, setChapters] = useState([]);
    const { comicID } = useParams();
    const [loading, setLoading] = useState(true);
    const [isFavorited, setIsFavorited] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const storedArrayJSON = localStorage.getItem('comicDatas');
    const currentAccount = localStorage.getItem("currentAccount");
    const fetchedData = [];
    const buttonData = [
        '開始閱讀', '收藏'
    ];
    let temp = [];
    let chapterInfo = [];

    const initData = async () => {
        try {
            const web3 = new Web3(window.ethereum);
            setWeb3(web3);
            const contractInstance = new web3.eth.Contract(comicData.abi, comicData.address);
            setWeb3Instance(contractInstance);

            const storedArray = JSON.parse(storedArrayJSON); // 假设 storedArrayJSON 是一个 JSON 字符串
            for (let i = 0; i < storedArray.length; i++) {
                if (storedArray[i].exists === 1) {
                    const filename = storedArray[i].filename;
                    const image = `${website}/api/comicIMG/${filename}`;
                    let protoFilename;
                    if (storedArray[i].protoFilename) {
                        protoFilename = `${website}/api/coverFile/${filename}/${storedArray[i].protoFilename}`;
                    } else {
                        protoFilename = image
                    }
                    if (storedArray[i].comicID === comicID) {
                        let author;
                        if (storedArray[i].author == currentAccount) {
                            author = '您是本作品的創作者!';
                        } else {
                            author = storedArray[i].author;
                        }
                        temp.push({
                            comicHash: storedArray[i].comicHash,
                            comicID: storedArray[i].comicID,
                            title: storedArray[i].title,
                            description: storedArray[i].description,
                            author: author,
                            category: storedArray[i].category,
                            protoFilename: protoFilename,
                        });
                    }
                }
            }
            //console.log(temp);
            setComic(temp);

            for (let i = 0; i < storedArray.length; i++) {
                // 類似漫畫 依據類型跟同作者取前4本
                if ((storedArray[i].category == temp[0].category || storedArray[i].author == temp[0].author) && storedArray[i].comicID != comicID) {
                    const image = `${website}/api/comicIMG/${storedArray[i].filename}`;
                    fetchedData.push({
                        comicID: storedArray[i].comicID,
                        title: storedArray[i].title,
                        description: storedArray[i].description,
                        author: storedArray[i].author,
                        category: storedArray[i].category,
                        image: image,
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
                    params: {
                        comicHash: temp[0].comicHash,
                        currentAccount: currentAccount
                    }
                });
                let chapters = response.data;
                sortByTimestamp(chapters);

                chapters = chapters.map((chapter, index) => {
                    let isBuying;
                    if (chapter.creator === currentAccount) {
                        isBuying = '閱讀';
                    } else if (chapter.isBuying !== null) {
                        isBuying = '閱讀';
                    } else {
                        isBuying = '購買';
                    }
                    return {
                        ...chapter,
                        chapterID: `chapter${index + 1}`,
                        isBuying
                    };
                });
                console.log(chapters);
                setChapters(chapters);

                let lastChapterInfo = chapters[chapters.length - 1];
                let updatedComic = temp.map(comic => {
                    return {...comic, chapter: lastChapterInfo.title};
                });
                setComic(updatedComic);
                //console.log(updatedComic);
            } catch (error) {
                console.error('Error fetching records:', error);
            }

            // 資料庫查詢收藏狀態
            try {
                const response = await axios.get(`${website}/api/comicDetail/isFavorited`, {
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
            setLoading(false);
        } catch (error) {
            console.error('Error initializing comic:', error);
        }
    };

    useEffect(() => {
        initData();
    }, [comicID]);

    const handleFavoriteClick = async () => {
        setIsFavorited(!isFavorited); // 切換收藏狀態
        try {
            const response = await axios.put(`${website}/api/update/comicDetail/favorite`, null, {
              params: {
                currentAccount: currentAccount,
                comicHash: comic[0].comicHash,
                bool: !isFavorited
              },
            });
        } catch (error) {
            console.error('Error handleFavoriteClick', error);
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

                const author = comic[0].author === '您是本作品的創作者!' ? currentAccount : comic[0].author;
                const formData = new FormData();
                formData.append('hash', transactionHash);
                formData.append('comic_id', comicHash);
                formData.append('chapter_id', chapterHash);
                formData.append('buyer', currentAccount);
                formData.append('creator', author);
                formData.append('purchase_date', Timestamp);
                formData.append('price', chapter.price);
                try {
                    const response = await axios.post(`${website}/api/add/records`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                    });
                    alert('章節購買成功！');
                    const updatedChapters = [...currentChapters];
                    updatedChapters[chapterId].isBuying = '閱讀'; // 更新章節的購買狀態
                    setChapters(updatedChapters);
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

    const truncateText = (text, maxLength) => {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };

    return (
        <>
            {!loading && (
                <Container className='comicDetail'>
                    <Row className="pt-5">
                        <div className="d-block mx-auto img-fluid carousel-image-container">
                            <img
                                className="d-block mx-auto img-fluid"
                                src={comic[0].protoFilename}
                                alt="800x400"
                            />
                        </div>
                    </Row>
                    <Row className="pt-3 pb-3 btn-container justify-content-center">
                        {buttonData.map((label, idx) => (
                            <Col key={idx} xs={2} md={2} lg={2} className="pb-3 btn-section d-flex justify-content-center">
                                <Button variant="outline-dark" className="custom-button" onClick={label === '收藏' ? handleFavoriteClick : undefined}>
                                    {label === '收藏' && (
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
                                    <p className="text-secondary">{comic.author}</p>
                                    <p>最新章節：{comic.chapter}</p>
                                    <p className="text-secondary">{comic.description}</p>
                                </React.Fragment>
                            ))}
                        </Col>
                    </Row>
                    <Row className='pt-5 chapter-title-section'>
                        <Col>
                            <div className='d-flex justify-content-between align-items-center'>
                                <h3 className='fw-bold mb-0'>章節目錄</h3>
                                <p className='text-end mb-0'>查看全部章節</p>
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
                                            <td className='text-center fw-bold'>第 {startIndex + index + 1} 章</td>
                                            <td className='text-center'>{chapter.title}</td>
                                            <td className='text-center'>{chapter.price}</td>
                                            <td className='text-center'>
                                                <button onClick={() => handlePurchase(index)} className="btn" value={chapter.isBuying}>{chapter.isBuying}</button>
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
                        <h3 className="fw-bold">類似漫畫</h3>
                    </Row>
                    <Row xs={1} md={2} className="g-4 pb-5">
                        {similComic.map((data, idx) => (
                            <Col key={idx} xs={6} md={3} className="pt-3">
                                <Link to={`/comicDetail/${data.comicID}`}>
                                    <Card>
                                        <Card.Img variant="top" src={data.image} />
                                        <Card.Body>
                                            <Card.Title>{data.title}</Card.Title>
                                            <Card.Text>{truncateText(data.description, 50)}</Card.Text>
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
                    <div>頁面加載中，請稍後...</div>
                </div>
            )}
        </>
    );
}

export default ComicDetail;

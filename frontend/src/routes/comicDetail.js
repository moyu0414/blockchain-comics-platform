import React, { useState, useEffect } from 'react';
import { Link, useParams } from "react-router-dom";
import { Container, Carousel, Card, Col, Row, Button, Dropdown, Figure, Table, ButtonGroup, ButtonToolbar, Pagination } from 'react-bootstrap';
import './bootstrap.min.css';
import { Heart, HeartFill } from 'react-bootstrap-icons';
import BootstrapTable from 'react-bootstrap-table-next';
import axios from 'axios';
import { sortByTimestamp } from '../index';

function ComicDetail() {
    const [comic, setComic] = useState([]);
    const [similComic, setSimilComic] = useState([]);
    const [chapters, setChapters] = useState([]);
    const { comicID } = useParams();
    const [loading, setLoading] = useState(true);
    const storedArrayJSON = localStorage.getItem('comicDatas');
    const currentAccount = localStorage.getItem("currentAccount");
    const fetchedData = [];
    let temp = [];
    let chapterInfo = [];

    const initData = async () => {
        try {
            const storedArray = JSON.parse(storedArrayJSON); // 假设 storedArrayJSON 是一个 JSON 字符串
            for (let i = 0; i < storedArray.length; i++) {
                if (storedArray[i].exists === 1) {
                    const filename = storedArray[i].filename;
                    const image = `http://localhost:5000/api/comicIMG/${filename}`;
                    let protoFilename;
                    if (storedArray[i].protoFilename) {
                        protoFilename = `http://localhost:5000/api/coverFile/${filename}/${storedArray[i].protoFilename}`;
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
            setComic(temp);

            for (let i = 0; i < storedArray.length; i++) {
                // 類似漫畫 依據類型跟同作者取前4本
                if ((storedArray[i].category == temp[0].category || storedArray[i].author == temp[0].author) && storedArray[i].comicID != comicID) {
                    const image = `http://localhost:5000/api/comicIMG/${storedArray[i].filename}`;
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
            console.log(fetchedData);
            setSimilComic(fetchedData);

            // 章節購買者
            try {
                const response = await axios.get('http://localhost:5000/api/comicDetail', {
                    params: {
                    comicHash: temp[0].comicHash,
                    currentAccount: currentAccount
                    }
                });
                let chapters = response.data;
                sortByTimestamp(chapters);

                for (let i = 0; i < chapters.length; i++) {
                    if (chapters[i].creator == currentAccount) {
                        chapters[i].isBuying = '閱讀';
                    } else if (chapters[i].isBuying !== null) {
                        chapters[i].isBuying = '閱讀';
                    } else {
                        chapters[i].isBuying = '購買';
                    }
                }
                console.log(chapters);
                setChapters(chapters);

                let lastChapterInfo = chapters[chapters.length - 1];
                let updatedComic = temp.map(comic => {
                    return {...comic, chapter: lastChapterInfo.title};
                });
                setComic(updatedComic);
                console.log(updatedComic);
            } catch (error) {
                console.error('Error fetching records:', error);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error initializing contract:', error);
        }
    };

    useEffect(() => {
        initData();
    }, [comicID]);

    const buttonData = [
        '開始閱讀', '收藏'
    ];

    
    const [isFavorited, setIsFavorited] = useState(false); // 初始狀態為為收藏

    const handleFavoriteClick = () => {
        setIsFavorited(!isFavorited); // 切換收藏狀態
    };

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; // 每頁顯示的章節數量
    const totalPages = Math.ceil(chapters.length / itemsPerPage);

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    // 計算當前頁面的章節切片的起始索引
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentChapters = chapters.slice(startIndex, startIndex + itemsPerPage);
    console.log(chapters);
    console.log(currentChapters);

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

    return (
        <div>
            {!loading &&
                <Container className='comicDetail'>
                    <Row className="pt-5">
                        <Figure>
                            <Figure.Image
                                className="d-block mx-auto img-fluid"
                                alt="800x400"
                                src={comic[0].protoFilename}
                            />
                        </Figure>
                    </Row>
                    <Row className="pt-2 pb-3 btn-container justify-content-center">
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
                        <Col className=''>
                            <div className='d-flex justify-content-between align-items-center'>
                                <h3 className='fw-bold mb-0'>章節目錄</h3>
                                <p className='text-end mb-0'>查看全部章節</p>
                            </div>
                            <hr/>
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
                                                <button className="btn" value={chapter.isBuying}>{chapter.isBuying}</button>
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
                                        <Card.Text>{data.description}</Card.Text>
                                    </Card.Body>
                                </Card>
                                </Link>
                            </Col>
                        ))}
                    </Row>
                    
                </Container>
            }
            {loading &&  
                <div className="loading-container">
                    <div>頁面加載中，請稍後...</div>
                </div>
            }
        </div>
    );
}

export default ComicDetail;

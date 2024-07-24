import React, { useState, useEffect } from 'react';
import { Link, useParams } from "react-router-dom";
import { Container, Carousel, Card, Col, Row, Button, Dropdown, Figure, Table, ButtonGroup, ButtonToolbar, Pagination } from 'react-bootstrap';
import './bootstrap.min.css';
import { Heart, HeartFill } from 'react-bootstrap-icons';
import BootstrapTable from 'react-bootstrap-table-next';
import axios from 'axios';
import { sortByTimestamp } from '../index';

function EditChapter() {
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
                //console.log(chapters);
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
            setLoading(false);
        } catch (error) {
            console.error('Error initializing contract:', error);
        }
    };

    useEffect(() => {
        initData();
    }, [comicID]);

    
    const [isFavorited, setIsFavorited] = useState(false); // 初始狀態為為收藏

    const [currentPage, setCurrentPage] = useState(1);
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

    return (
        <div>
            {/* {!loading && */}
                <Container className='comicDetail'>
                    {/* 此處會放上該漫畫的封面+名稱供預覽 跟創作者頁面creatorPage的一樣*/}
                    <Row xs={1} md={2} className="g-4 pb-5">
                        {comic.map((data, idx) => (
                            <Col key={idx} xs={4} md={3} className="pt-3">
                            <Link to={`/comicDetail/${data.comicID}`}>
                                <Card>
                                    <Card.Img variant="top" src={data.image} />
                                    <Card.Body>
                                        <Card.Title className='text-center'>{data.title}</Card.Title>
                                    </Card.Body>
                                </Card>
                            </Link>
                            </Col>
                        ))}
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
                                            <td className='text-center'>
                                                <button className="btn">編輯</button>
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
                    
                </Container>
            {/* }
            {loading &&  
                <div className="loading-container">
                    <div>頁面加載中，請稍後...</div>
                </div>
            } */}
        </div>
    );
}

export default EditChapter;

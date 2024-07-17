import React, { useState } from 'react';
import { Container, Carousel, Card, Col, Row, Button, Dropdown, Figure, Table, ButtonGroup, ButtonToolbar, Pagination } from 'react-bootstrap';
import './bootstrap.min.css';
import { Heart, HeartFill } from 'react-bootstrap-icons';
import BootstrapTable from 'react-bootstrap-table-next';

function ComicDetail() {
    const cardData = [
        { title: '漫畫 1', text: '漫畫 1 描述', image: 'https://via.placeholder.com/150' },
        { title: '漫畫 2', text: '漫畫 2 描述', image: 'https://via.placeholder.com/150' },
        { title: '漫畫 3', text: '漫畫 3 描述', image: 'https://via.placeholder.com/150' },
        { title: '漫畫 4', text: '漫畫 4 描述', image: 'https://via.placeholder.com/150' }
    ];

    const buttonData = [
        '開始閱讀', '收藏'
    ];

    
    const current = [
        { title: '漫畫 1', author: '作者 1', chapter: '第 10 章', description: '這是漫畫 1 的描述' }
    ];

    const [isFavorited, setIsFavorited] = useState(false); // 初始狀態為為收藏

    const handleFavoriteClick = () => {
        setIsFavorited(!isFavorited); // 切換收藏狀態
    };

    const chapters = [
        { title: '章節 1章節 1章節 1章節 1', chapterPrice: '0.01', isBuying: '購買' },
        { title: '章節 2', chapterPrice: '0.02', isBuying: '購買' },
        // 添加更多章節來測試分頁功能
        { title: '章節 3', chapterPrice: '0.03', isBuying: '購買' },
        { title: '章節 4', chapterPrice: '0.04', isBuying: '購買' },
        { title: '章節 5', chapterPrice: '0.05', isBuying: '購買' },
        { title: '章節 6', chapterPrice: '0.06', isBuying: '購買' },
        { title: '章節 7', chapterPrice: '0.03', isBuying: '購買' },
        { title: '章節 8', chapterPrice: '0.04', isBuying: '購買' },
        { title: '章節 9', chapterPrice: '0.05', isBuying: '購買' },
        { title: '章節 10', chapterPrice: '0.6', isBuying: '購買' },
        { title: '章節 11', chapterPrice: '0.01', isBuying: '購買' },
        { title: '章節 12', chapterPrice: '0.03', isBuying: '購買' }
    ];

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
        
        <Container className='comicDetail'>
            <Row className="pt-5">
                <Figure>
                    <Figure.Image
                        className="d-block mx-auto img-fluid"
                        alt="800x400"
                        src="https://via.placeholder.com/1200x400?text=Banner Image"
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
                    {current.map((comic, index) => (
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
                                    <td className='text-center'>{chapter.chapterPrice}</td>
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
                
                {cardData.map((data, idx) => (
                    <Col key={idx} xs={6} md={3} className="pt-3">
                    <Card>
                        <Card.Img variant="top" src={data.image} />
                        <Card.Body>
                            <Card.Title>{data.title}</Card.Title>
                            <Card.Text>{data.text}</Card.Text>
                        </Card.Body>
                    </Card>
                    </Col>
                ))}
            </Row>
            
        </Container>
    );
}

export default ComicDetail;

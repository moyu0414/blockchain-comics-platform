import React, { useState } from 'react';
import { Container, Carousel, Card, Col, Row, Button, Dropdown, Figure, Table, ButtonGroup, ButtonToolbar, Pagination } from 'react-bootstrap';
import './bootstrap.min.css';
import { Heart, HeartFill } from 'react-bootstrap-icons';
import BootstrapTable from 'react-bootstrap-table-next';

function CreatorNft() {

    const images = [
        "https://via.placeholder.com/120x60?text=Image",
        "https://via.placeholder.com/120x60?text=Image",
        "https://via.placeholder.com/120x60?text=Image",
        "https://via.placeholder.com/120x60?text=Image"
    ];

    const incomes = [
        { date: '2024/7/11', time: '尚未確定放甚麼內容', price: '0.02'},
        { date: '2024/7/11', time: '尚未確定放甚麼內容', price: '0.02'},
        { date: '2024/7/11', time: '尚未確定放甚麼內容', price: '0.02'},
        { date: '2024/7/11', time: '尚未確定放甚麼內容', price: '0.02'},
        { date: '2024/7/11', time: '尚未確定放甚麼內容', price: '0.02'},
        { date: '2024/7/11', time: '尚未確定放甚麼內容', price: '0.02'},
        { date: '2024/7/11', time: '尚未確定放甚麼內容', price: '0.02'},
        { date: '2024/7/11', time: '尚未確定放甚麼內容', price: '0.02'},
        { date: '2024/7/11', time: '尚未確定放甚麼內容', price: '0.02'},
        { date: '2024/7/11', time: '尚未確定放甚麼內容', price: '0.02'},
        { date: '2024/7/11', time: '尚未確定放甚麼內容', price: '0.02'},
        { date: '2024/7/11', time: '尚未確定放甚麼內容', price: '0.02'},
        { date: '2024/7/11', time: '尚未確定放甚麼內容', price: '0.02'},
        { date: '2024/7/11', time: '尚未確定放甚麼內容', price: '0.02'}
    ];

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; // 每頁顯示的收益數量
    const totalPages = Math.ceil(incomes.length / itemsPerPage);

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    // 計算當前頁面的收益切片的起始索引
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentIncome = incomes.slice(startIndex, startIndex + itemsPerPage);

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
        
        <Container className='creatorNft'>
            <Row className='pt-5'>
                <h3 className="fw-bold">已發布NFT</h3>
            </Row>
            <Row className='pt-1 pb-5'>
                {images.map((src, index) => (
                <Col xs={4} md={3} className="pt-3">
                    <Card className="effect-image-1">
                        <Card.Img variant="top" src={src} alt={`image-${index + 1}`} />
                        <Card.Body className="simple-text">
                            <Card.Text>名稱名稱</Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
                ))}
            </Row>
            <Row>
                <h3 className="fw-bold">NFT交易情形</h3>
            </Row>
            <Row className='justify-content-center'>
                <Col className='d-flex justify-content-center chapter-table pt-3'>
                    <Table size="sm">
                        <thead>
                            <tr>
                                <th className='text-center fw-bold'>日期</th>
                                <th className='text-center fw-bold'>交易序號</th>
                                <th className='text-center fw-bold'>收益</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentIncome.map((income, index) => (
                                <tr key={index}>
                                    <td className='text-center'>{income.date}</td>
                                    <td className='text-center'>{income.time}</td>
                                    <td className='text-center'>{income.price}</td>
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
    );
}

export default CreatorNft;

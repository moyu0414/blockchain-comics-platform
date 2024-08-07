import React, { useState, useEffect } from 'react';
import { Container, Carousel, Card, Col, Row, Button, Dropdown, Figure, Table, ButtonGroup, ButtonToolbar, Pagination } from 'react-bootstrap';
import './bootstrap.min.css';
import { Heart, HeartFill } from 'react-bootstrap-icons';
import BootstrapTable from 'react-bootstrap-table-next';
import axios from 'axios';
import { formatDate, formatTime, sortByDatetime } from '../index.js';

function Analysis() {
    const [creatorLogArray, setCreatorLogArray] = useState([]);
    const currentAccount = localStorage.getItem("currentAccount");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; // 每頁顯示的收益數量
    let analysisArray = [];

    const initData = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/creator/records', {
                params: {
                    currentAccount: currentAccount
                }
            });
            let analysis = response.data;
            sortByDatetime(analysis);

            for (var n = 0; n < analysis.length; n++) {
                let date = formatDate(new Date(analysis[n].purchase_date));
                let time = formatTime(new Date(analysis[n].purchase_date));
                let chapterPrice = analysis[n].price;
                let income = (chapterPrice * 0.9).toFixed(3);  // 四捨五入取到小數點第3位
                analysisArray.push({
                  title: analysis[n].comicTitle + " / " + analysis[n].chapterTitle,
                  date: date,
                  time: time,
                  income: income
                });
              };
              console.log(analysisArray);
              setCreatorLogArray(analysisArray);
        } catch (error) {
            console.error('Error fetching records:', error);
        }
    };

    useEffect(() => {
        initData();
    }, [currentAccount]);

    const totalPages = Math.ceil(creatorLogArray.length / itemsPerPage);
    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    // 計算當前頁面的收益切片的起始索引
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentIncome = creatorLogArray.slice(startIndex, startIndex + itemsPerPage);
    let totalPrice = creatorLogArray.reduce((total, item) => {
        let income = parseFloat(item.income);
        total += income;
        return Number(total.toFixed(3));
    }, 0); // 初始值为 0

    if (totalPrice == 0) {
        totalPrice = '目前無人購買'
    }


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
        <Container className='analysis'>
            <Row className='pt-5 justify-content-center'>
                <h1 className="fw-bold text-center">{totalPrice}</h1>
            </Row>
            <Row className='pt-5 justify-content-center'>
                <Col className='d-flex justify-content-center chapter-table'>
                    <Table size="sm">
                        <thead>
                            <tr>
                                <th className='text-center fw-bold'>日期</th>
                                <th className='text-center fw-bold'>漫畫 / 章節</th>
                                <th className='text-center fw-bold'>收益</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentIncome.map((income, index) => (
                                <tr key={index}>
                                    <td className='text-center fw-bold'>{income.date}<br />{income.time}</td>
                                    <td className='text-center'>{income.title}</td>
                                    <td className='text-center'>{income.income}</td>
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

export default Analysis;

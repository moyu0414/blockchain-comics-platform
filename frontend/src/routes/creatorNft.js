import React, { useState, useEffect } from 'react';
import { Container, Card, Col, Row, Table, ButtonToolbar, Pagination } from 'react-bootstrap';
import './bootstrap.min.css';
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import axios from 'axios';
const website = process.env.REACT_APP_Website;
const API_KEY = process.env.REACT_APP_API_KEY;

function CreatorNft() {
    const [comic, setComic] = useState([]);
    const [saleNFT, setSaleNFT] = useState([]);
    const [loading, setLoading] = useState(true);
    const [beingNFT, setBeingNFT] = useState(true);
    const [isSale, setIsSale] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; // 每頁顯示的收益數量
    const { t } = useTranslation();
    const language = localStorage.getItem('language') || i18n.language;
    const currentAccount = localStorage.getItem("currentAccount");
    const headers = {'api-key': API_KEY};

    let allRecord = [];
    let purchased = [];
    let CountComicDetails = {};
    let currentComic = [];
    let comicStats = {};

    const initData = async () => {
        const response = await axios.get(`${website}/api/creatorNft/records`, {
            headers: headers,
            params: {
                currentAccount: currentAccount
            }
        });
        let nftData = response.data;
        console.log(nftData);

        nftData.forEach(item => {
            const descTitle = parseAuthorizations(item.description);
            const firstName = descTitle[0]?.name || '';
            const keyData = `${item.comicHash}-${item.price}-${item.royalty}-${item.description || ""}`;
            allRecord.push({
                ...item,
                firstName,
                keyData,
            });
            if (!comicStats[keyData]) {
                comicStats[keyData] = { tot: 0, sale: 0 };
            }
            comicStats[keyData].tot += 1;
            if (item.forSale === 0) {  // 已售出的 NFT
                comicStats[keyData].sale += 1;
                purchased.push({
                    tokenId: item.tokenId,
                    comicHash: item.comicHash,
                    title: item.title,
                    price: (item.price * 0.98).toFixed(3),
                    royalty: item.royalty
                });
            }
        });
        allRecord.forEach(data => {
            const key = data.keyData;
            if (!CountComicDetails[key]) {
                CountComicDetails[key] = true;
                currentComic.push({
                    ...data,
                    totQty: comicStats[key]?.tot || 0,
                    saleQty: comicStats[key]?.sale || 0
                });
            }
        });
        const fetchImage = async (data) => {
            const url = data.protoFilename === 1
                ? `${website}/api/coverFile/${data.filename}/${data.protoFilename}`
                : `${website}/api/comicIMG/${data.filename}`;
            const response = await axios.get(url, { responseType: 'blob', headers });
            data.image = URL.createObjectURL(response.data);
        };
        await Promise.all(currentComic.map(fetchImage));

        console.log(currentComic);
        console.log(purchased);
        if (currentComic.length === 0) {
            setBeingNFT(false);
        } else if (purchased.length === 0) {
            setIsSale(false);
        }
        setComic(currentComic);
        setSaleNFT(purchased);
        setLoading(false);
    };

    useEffect(() => {
        initData();
    }, [currentAccount]);

    const parseAuthorizations = (text) => {
        text = text.trim();
        const lines = text.includes('\n') ? text.split('\n') : [text];
        return lines.map(line => {
            const [name] = line.split(':');
            return {
                name: t(name.trim()),
            };
        });
    };

    const totalPages = Math.ceil(saleNFT.length / itemsPerPage);

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    // 計算當前頁面的收益切片的起始索引
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentIncome = saleNFT.slice(startIndex, startIndex + itemsPerPage);

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

    const truncateText = (text, maxLength) => {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };

    const truncateTextForName = (text) => {
        const isChinese = (char) => /[\u4e00-\u9fa5]/.test(char);
        const maxLength = text.split('').some(isChinese) ? 3 : 6;  // 中文3個字、英文6個字
        return truncateText(text, maxLength);
    };


    return (
        <>
            {!loading ? (
                <Container className='creatorNft'>
                    <Row className='pt-5'>
                        <h3 className="fw-bold">{t('已發行NFT')}</h3>
                    </Row>
                    {!beingNFT &&  
                        <Row className='pt-5 justify-content-center'>
                            <h1 className="fw-bold text-center">{t('目前尚未鑄造NFT')}</h1>
                        </Row>
                    }
                    <Row className='pt-1 pb-5'>
                        {comic.map((data, index) => (
                            <Col xs={4} md={3} className="pt-3" key={index}>
                                <Link to={`/nftDetail/tokenId${data.tokenId}`}>
                                    <Card className="effect-image-1">
                                        <Card.Img variant="top" src={data.image} alt={`image-${index + 1}`} />
                                        <div className="nftMarket-overlay-owner">{data.saleQty}/{data.totQty}</div>
                                        <div className="nftMarket-overlay">{truncateTextForName(data.firstName)}</div>
                                        <Card.Body className="simple-text">
                                            <Card.Text>{data.title}</Card.Text>
                                        </Card.Body>
                                    </Card>
                                </Link>
                            </Col>
                        ))}
                    </Row>
                    <Row>
                        <h3 className="fw-bold">{t('NFT交易情形')}</h3>
                    </Row>
                    {!isSale &&
                        <Row className='pt-5 justify-content-center'>
                            <h1 className="fw-bold text-center">{t('目前無人購買NFT')}</h1>
                        </Row>
                    }
                    <Row className='justify-content-center'>
                        <Col className='d-flex justify-content-center chapter-table pt-3'>
                            <Table size="sm">
                                <thead>
                                    <tr>
                                        <th className='text-center fw-bold'>tokenId</th>
                                        <th className='text-center fw-bold'>{t('名稱')}</th>
                                        <th className='text-center fw-bold'>{t('收益')}</th>
                                        <th className='text-center fw-bold'>{t('詳情')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentIncome.map((data, index) => (
                                        <tr key={index}>
                                            <td className='text-center'>{data.tokenId}</td>
                                            <td className='text-center'>{data.title}</td>
                                            <td className='text-center'>{data.price}</td>
                                            <td className='text-center'>
                                                <Link to={`/nftDetail/tokenId${data.tokenId}`}>
                                                    <button className="btn">{t('詳情')}</button>
                                                </Link>
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
                </Container>
            ) : (
                <div className="loading-container">
                    <div>{t('頁面加載中')}</div>
                </div>
            )}
        </>
    );
}

export default CreatorNft;

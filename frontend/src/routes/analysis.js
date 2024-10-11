import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Col, Row, Table, ButtonToolbar, Pagination, Tabs, Tab, Card } from 'react-bootstrap';
import './bootstrap.min.css';
import { Heart, HeartFill } from 'react-bootstrap-icons';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { formatDate, formatTime, sortByDatetime } from '../index.js';
const website = process.env.REACT_APP_Website;
const API_KEY = process.env.REACT_APP_API_KEY;

function Analysis() {
    const [creatorLogArray, setCreatorLogArray] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(null);

    const [comic, setComic] = useState([]);
    const [saleNFT, setSaleNFT] = useState([]);
    const [loading, setLoading] = useState(true);
    const [beingNFT, setBeingNFT] = useState(true);

    const { t } = useTranslation();
    const currentAccount = localStorage.getItem("currentAccount");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; // 每頁顯示的收益數量
    const headers = {'api-key': API_KEY};

    const price = 0.98;
    let allRecord = [];
    let purchased = [];
    let CountComicDetails = {};
    let currentComic = [];
    let comicStats = {};

    const initData = async () => {
        try {
            const response = await axios.get(`${website}/api/creator/records`, {
                headers: headers,
                params: {
                    currentAccount: currentAccount
                }
            });
            let analysis = response.data;
            sortByDatetime(analysis);
            const comicOrigin = analysis.map(item => {
                const date = formatDate(new Date(item.purchase_date));
                const income = (item.price * 0.9).toFixed(3);
                return {
                    title: `${item.comicTitle} / ${item.chapterTitle}`,
                    date,
                    income,
                    buyer: item.buyer
                };
            });
            setCreatorLogArray(comicOrigin);

            const nftResponse = await axios.get(`${website}/api/creatorNft/records`, {
                headers: headers,
                params: {
                    currentAccount: currentAccount
                }
            });
            let nftData = nftResponse.data;
            nftData.forEach(item => {
                const descTitle = parseAuthorizations(item.description);
                const keyData = `${item.comicHash}-${item.price}-${item.royalty}-${item.description || ""}`;
                const lastPriceValue = Object.values(item.price).pop();
                allRecord.push({
                    ...item,
                    keyData,
                    price: lastPriceValue
                });
                if (!comicStats[keyData]) {
                    comicStats[keyData] = { tot: 0, sale: 0 };
                }
                comicStats[keyData].tot += 1;
    
                if (item.minter !== item.owner) {  // 已售出的 NFT
                    comicStats[keyData].sale += 1;
                    const price = 0.98;
                    const keys = Object.keys(item.price);
                    const lastKey = keys[keys.length - 1];
                    const secondLastKey = keys[keys.length - 2] || null; // 如果没有倒数第二个键，设置为 null
                    const lastValue = parseFloat(item.price[lastKey]);
                    let total = 0;
                    if (item.forSale === 0) {  // 已售
                        if (lastKey === '1') {  // 只賣一個(首賣)
                            total = parseFloat(item.price[lastKey]) * price;
                        } else {  // 賣一個以上(首賣&轉手)
                            total += parseFloat(item.price[keys[0]]) * price;
                            for (const key of keys) {
                                if (key !== keys[0]) { // 跳过第一个键
                                    total += parseFloat(item.price[key]) * (item.royalty / 100);
                                }
                            }
                        }
                    } else if (item.forSale === 1) {  // 未售
                        if (secondLastKey) {  // 存在第二筆價格
                            total += parseFloat(item.price[keys[0]]) * price;  // 首賣
                            for (const key of keys.slice(1, -1)) { // 从第二筆到倒数第二筆，最後一筆未售，不用加
                                total += parseFloat(item.price[key]) * (item.royalty / 100);
                            }
                        }
                    }
                    purchased.push({
                        tokenId: item.tokenId,
                        comicHash: item.comicHash,
                        title: item.title,
                        tokenTitle: item.tokenTitle,
                        price: total.toFixed(3),
                    });
                }
            });
            purchased.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
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
                const nftImgResponse = await axios.get(`${website}/api/nftIMG/${data.comicHash}/${data.tokenId}`, {
                    responseType: 'blob',
                    headers,
                });
                if (nftImgResponse.data.type === 'image/jpeg') {
                    data.image = URL.createObjectURL(nftImgResponse.data);
                } else {
                    const url = data.protoFilename === 1
                    ? `${website}/api/coverFile/${data.filename}/${data.protoFilename}`
                    : `${website}/api/comicIMG/${data.filename}`;
                    const coverImgResponse = await axios.get(url, { responseType: 'blob', headers });
                    data.image = URL.createObjectURL(coverImgResponse.data);
                }
            };
            await Promise.all(currentComic.map(fetchImage));
    
            if (currentComic.length === 0) {
                setBeingNFT(false);
            }
            setComic(currentComic);
            setSaleNFT(purchased);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching records:', error);
        }
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

    let totalPrice = creatorLogArray.reduce((total, item) => {
        let income = parseFloat(item.income);
        total += income;
        return Number(total.toFixed(3));
    }, 0); // 初始值为 0

    if (totalPrice == 0) {
        totalPrice = t('目前無人購買')
    };

    let nftTotalPrice = saleNFT.reduce((total, item) => {
        let price = parseFloat(item.price);
        total += price;
        return Number(total.toFixed(3));
    }, 0);

    if (nftTotalPrice == 0) {
        nftTotalPrice = `${t('目前無人購買')}NFT`;
    };

    const startIndex = (currentPage - 1) * itemsPerPage;
    const comicIncome = creatorLogArray.slice(startIndex, startIndex + itemsPerPage);
    const nftIncome = saleNFT.slice(startIndex, startIndex + itemsPerPage);

    const calculatePagination = (dataArray, handlePageChange) => {
        const totalPages = Math.ceil(dataArray.length / itemsPerPage);
        const pageItems = [];
        const maxPagesToShow = 5;
        if (totalPages <= maxPagesToShow) {
            for (let i = 1; i <= totalPages; i++) {
                pageItems.push(
                    <Pagination.Item key={i} active={i === currentPage} onClick={() => handlePageChange(i)}>
                        {i}
                    </Pagination.Item>
                );
            }
        } else {
            const middlePages = Math.floor(maxPagesToShow / 2);
            let startPage = Math.max(2, currentPage - middlePages);
            let endPage = Math.min(totalPages - 1, currentPage + middlePages);
            if (currentPage - startPage <= middlePages) {
                endPage = Math.min(totalPages - 1, startPage + maxPagesToShow - 2);
            }
            if (endPage - currentPage <= middlePages) {
                startPage = Math.max(2, endPage - maxPagesToShow + 2);
            }
            pageItems.push(
                <Pagination.Item key={1} active={currentPage === 1} onClick={() => handlePageChange(1)}>
                    1
                </Pagination.Item>
            );
            if (startPage > 2) {
                pageItems.push(<Pagination.Ellipsis key="ellipsis-start" />);
            }
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
            pageItems.push(
                <Pagination.Item key={totalPages} active={currentPage === totalPages} onClick={() => handlePageChange(totalPages)}>
                    {totalPages}
                </Pagination.Item>
            );
        }
        return pageItems;
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };


    return (
        <>
            {!loading ? (
                <Container className='analysis creatorNft'>
                    <div className='analysis-title'>
                        <h2 className='text-center fw-bold'>{t('收益總攬')}</h2>
                    </div>
                    <Tabs defaultActiveKey="comic" id="data-analysis-tabs" className="mt-4 mb-3 w-100">
                        <Tab eventKey="comic" title={t('漫畫')}>
                            <Row className='pt-3 justify-content-center'>
                                <h1 className="fw-bold text-center">{totalPrice}</h1>
                            </Row>
                            <Row className='pt-3 justify-content-center'>
                                <Col className='d-flex justify-content-center chapter-table'>
                                    <Table size="sm">
                                        <thead>
                                            <tr>
                                                <th className='text-center fw-bold'>{t('交易日期')}</th>
                                                <th className='text-center fw-bold'>{t('漫畫 / 章節')}</th>
                                                <th className='text-center fw-bold'>{t('收益')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="comicManagement">
                                            {comicIncome.map((income, index) => (
                                                <tr key={index}>
                                                    <td className='text-center fw-bold'>{income.date}</td>
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
                                                onClick={() => handlePageChange(currentPage - 1)} 
                                                disabled={currentPage <= 1} 
                                                className='pagination-button'
                                            />
                                            {calculatePagination(
                                                creatorLogArray,
                                                handlePageChange
                                            )}
                                            <Pagination.Next 
                                                onClick={() => handlePageChange(currentPage + 1)} 
                                                disabled={currentPage >= Math.ceil(creatorLogArray.length / itemsPerPage)}
                                                className='pagination-button'
                                            />
                                        </Pagination>
                                    </ButtonToolbar>
                                </Col>
                            </Row>
                        </Tab>
                        <Tab eventKey="nft" title="NFT">
                            {!beingNFT &&  
                                <Row className='pt-5 justify-content-center'>
                                    <h1 className="fw-bold text-center">{t('目前尚未鑄造NFT')}</h1>
                                </Row>
                            }
                            <Row className="pb-1">
                                {comic.map((data, index) => (
                                    <Col xs={4} md={3} className="pt-2" key={index}>
                                    <Link to={`/nftDetail/tokenId${data.tokenId}`}>
                                        <Card className="effect-image-1">
                                        <Card.Img variant="top" src={data.image} alt={`image-${index + 1}`} />
                                        <div className="creatorNft-overlay">
                                            <span
                                                style={{
                                                    color: data.saleQty === 0 
                                                    ? '#F44336' // 已售數量為 0 顯示紅色
                                                    : data.saleQty === data.totQty 
                                                    ? '#BBFFFF' // 已售數量等於總數時顯示綠色
                                                    : '#FFC107' // 其他情況顯示橙色
                                                }}
                                            >
                                            {t('已售')}: {data.saleQty} {t('總數')}: {data.totQty}
                                            </span>
                                        </div>
                                        <Card.Body className="simple-text">
                                            <Card.Text className="creatorNft-text">{data.tokenTitle}</Card.Text>
                                        </Card.Body>
                                        </Card>
                                    </Link>
                                    </Col>
                                ))}
                            </Row>
                            <hr />
                            <Row className='pt-2 justify-content-center'>
                                <h1 className="fw-bold text-center">{nftTotalPrice}</h1>
                            </Row>
                            <Row className='justify-content-center'>
                                <Col className='d-flex justify-content-center chapter-table pt-3'>
                                    <Table size="sm">
                                        <thead>
                                            <tr>
                                                <th className='text-center fw-bold'>tokenId</th>
                                                <th className='text-center fw-bold'>{t('漫畫')} / NFT</th>
                                                <th className='text-center fw-bold'>{t('總收益')}</th>
                                                <th className='text-center fw-bold'>{t('詳情')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {nftIncome.map((data, index) => (
                                                <tr key={index}>
                                                    <td className='text-center'>{data.tokenId}</td>
                                                    <td className='text-center'>{data.title} / {data.tokenTitle}</td>
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
                                            {calculatePagination(
                                                saleNFT,
                                                handlePageChange
                                            )}
                                            <Pagination.Next 
                                                onClick={() => handlePageChange(currentPage + 1)} 
                                                disabled={currentPage >= Math.ceil(saleNFT.length / itemsPerPage)}
                                                className='pagination-button'
                                            />
                                        </Pagination>
                                    </ButtonToolbar>
                                </Col>
                            </Row>
                        </Tab>
                    </Tabs>
                </Container>
            ) : (
                <div className="loading-container">
                    <div>{t('頁面加載中')}</div>
                </div>
            )}
        </>
    );
}

export default Analysis;

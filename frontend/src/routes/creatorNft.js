import React, { useState, useEffect } from 'react';
import { Container, Card, Col, Row, Table, ButtonToolbar, Pagination } from 'react-bootstrap';
import './bootstrap.min.css';
import { Link } from "react-router-dom";
import Web3 from 'web3';
import comicData from '../contracts/ComicPlatform.json';

function CreatorNft() {
    const [comic, setComic] = useState([]);
    const [saleNFT, setSaleNFT] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; // 每頁顯示的收益數量
    const currentAccount = localStorage.getItem("currentAccount");
    const storedArrayJSON = localStorage.getItem('comicDatas');
    const storedArray = JSON.parse(storedArrayJSON);

    let allRecord = [];
    let currentComic = [];
    let purchased = [];
    let CountComicHash = {};
    let comicStats = {};

    const initData = async () => {
        const web3 = new Web3(window.ethereum);
        const contract = new web3.eth.Contract(comicData.abi, comicData.address);
        //console.log(contract);
        const totCount = await contract.methods.tokenCounter().call();
        

        // 获取 NFT 数据
        for (let i = 0; i < totCount; i++) {
            const data = await contract.methods.nfts(i).call();
            if (data.minter.toLowerCase() === currentAccount) {
                let price = data.price.toString() / 1e18;
                let tokenId = `tokenId${data.tokenId.toString()}`;
                allRecord.push({
                    tokenId: tokenId,
                    comicHash: data.comicHash,
                    forSale: data.forSale,
                    royalty: data.royalty.toString()
                });
                if (!data.forSale) {  // 已售出的 NFT
                    purchased.push({
                        tokenId: data.tokenId.toString(),
                        comicHash: data.comicHash,
                        price: price * 0.98,
                        royalty: data.royalty.toString()
                    });
                }
                if (!comicStats[data.comicHash]) {
                    comicStats[data.comicHash] = { tot: 0, sale: 0 };
                }
                comicStats[data.comicHash].tot += 1;
                if (!data.forSale) {
                    comicStats[data.comicHash].sale += 1;
                }
            }
        }
        for (const data of allRecord) {
            if (!CountComicHash[data.comicHash]) {
                CountComicHash[data.comicHash] = true;
                currentComic.push({
                    tokenId: data.tokenId,
                    comicHash: data.comicHash,
                    forSale: data.forSale,
                    royalty: data.royalty.toString(),
                    totQty: comicStats[data.comicHash]?.tot || 0,
                    saleQty: comicStats[data.comicHash]?.sale || 0
                });
            }
        }
        const comicMap = new Map(storedArray.map(comic => [comic.comicHash, comic]));
        for (const data of currentComic) {
            const comic = comicMap.get(data.comicHash);
            if (comic) {
                data.title = comic.title;
                data.image = `http://localhost:5000/api/coverFile/${comic.filename}/${comic.protoFilename || comic.filename}`;
            }
        }
        for (const purchase of purchased) {
            const comic = comicMap.get(purchase.comicHash);
            if (comic) {
                purchase.title = comic.title;
            }
        }
        console.log(currentComic);
        setComic(currentComic);
        setSaleNFT(purchased);
        setLoading(false);
    };

    useEffect(() => {
        initData();
    }, [currentAccount]);


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

    return (
        <>
            {!loading ? (
                <Container className='creatorNft'>
                    <Row className='pt-5'>
                        <h3 className="fw-bold">已發布NFT</h3>
                    </Row>
                    <Row className='pt-1 pb-5'>
                        {comic.map((data, index) => (
                            <Col xs={4} md={3} className="pt-3" key={index}>
                                <Link to={`/nftDetail/${data.tokenId}`}>
                                    <Card className="effect-image-1">
                                        <Card.Img variant="top" src={data.image} alt={`image-${index + 1}`} />
                                        <div className="nftMarket-overlay">{data.saleQty}/{data.totQty}</div>
                                        <Card.Body className="simple-text">
                                            <Card.Text>{data.title}</Card.Text>
                                        </Card.Body>
                                    </Card>
                                </Link>
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
                                        <th className='text-center fw-bold'>tokenId</th>
                                        <th className='text-center fw-bold'>名稱</th>
                                        <th className='text-center fw-bold'>收益</th>
                                        <th className='text-center fw-bold'>詳情</th>
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
                                                    <button className="btn">詳情</button>
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
                    <div>頁面加載中，請稍後...</div>
                </div>
            )}
        </>
    );
}

export default CreatorNft;

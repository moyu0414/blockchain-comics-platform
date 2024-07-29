import React, { useState, useEffect } from 'react';
import { Container, Card, Col, Row, Pagination } from 'react-bootstrap';
import './bootstrap.min.css';
import { Link } from "react-router-dom";
import Web3 from 'web3';
import comicData from '../contracts/ComicPlatform.json';

function CollectionNft() {
    const [comic, setComic] = useState([]);
    const [loading, setLoading] = useState(true);
    const currentAccount = localStorage.getItem("currentAccount");
    const storedArrayJSON = localStorage.getItem('comicDatas');
    const storedArray = JSON.parse(storedArrayJSON);
    let records = [];
    let temp = [];

    const initData = async () => {
        const web3 = new Web3(window.ethereum);
        const contract = new web3.eth.Contract(comicData.abi, comicData.address);
        //console.log(contract);
        const totCount = await contract.methods.tokenCounter().call();
        for (let i = 0; i < totCount.toString(); i++) {
            const data = await contract.methods.nfts(i).call();
            if (data.minter.toLowerCase() === currentAccount) {
                let price = data.price.toString() / 1e18;
                let tokenId = `tokenId${data.tokenId.toString()}`;
                records.push({
                    tokenId: tokenId,
                    comicHash: data.comicHash,
                    forSale: data.forSale,
                    price: price,
                    royalty: data.royalty.toString()
                })
            }
        }
        console.log(records);
        
        for (let i = 0; i < storedArray.length; i++) {
            if (storedArray[i].exists === 1) {
                const image = `http://localhost:5000/api/comicIMG/${storedArray[i].filename}`;
                let protoFilename;
                if (storedArray[i].protoFilename) {
                    protoFilename = `http://localhost:5000/api/coverFile/${storedArray[i].filename}/${storedArray[i].protoFilename}`;
                } else {
                    protoFilename = image
                }
                if (storedArray[i].author === currentAccount) {
                    const record = records.find(record => record.comicHash === storedArray[i].comicHash);
                    if (record) {
                      temp.push({
                        title: storedArray[i].title,
                        image: protoFilename,
                        tokenId: record.tokenId
                      });
                    }
                }
            }
        }
        console.log(temp);
        setComic(temp);
        setLoading(false);
    };

    useEffect(() => {
        initData();
    }, [currentAccount]);





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
        <>
            {!loading ? (
                <>
                <Container className='creatorNft'>
                    <Row className='pt-5'>
                    <h3 className="fw-bold">已收藏NFT</h3>
                    </Row>
                    <Row className='pt-1 pb-5'>
                    {comic.map((data, index) => (
                        <Col xs={4} md={3} className="pt-3" key={index}>
                        <Link to={`/nftDetail/${data.tokenId}`}>
                            <Card className="effect-image-1">
                            <Card.Img variant="top" src={data.image} alt={`image-${index + 1}`} />
                            <Card.Body className="simple-text">
                                <Card.Text>{data.title}</Card.Text>
                                <Card.Text>標題</Card.Text>
                            </Card.Body>
                            </Card>
                        </Link>
                        </Col>
                    ))}
                    </Row>
                </Container>
                </>
            ) : (
                <div className="loading-container">
                <div>頁面加載中，請稍後...</div>
                </div>
            )}
        </>
    );
}

export default CollectionNft;

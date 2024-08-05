import React, { useState, useEffect } from "react";
import axios from 'axios';
import { formatDate, formatTime, sortByDatetime } from '../index.js';
import { Container, Carousel, Card, Col, Row, Button, Dropdown, Figure, Table, ButtonGroup, ButtonToolbar, Pagination,Tabs, Tab } from 'react-bootstrap';
import './bootstrap.min.css';
import { Link } from "react-router-dom";
import Web3 from 'web3';
import comicData from '../contracts/ComicPlatform.json';
const website = process.env.REACT_APP_Website;

const PurchaseHistory = () => {
  const [readerLogArray, setReaderLogArray] = useState([]);
  const [NFTLogArray, setNFTLogArray] = useState([]);
  const [beingComic, setBeingComic] = useState(true);
  const [beingNFT, setBeingNFT] = useState(true);
  const currentAccount = localStorage.getItem("currentAccount");
  const storedArrayJSON = localStorage.getItem('comicDatas');
  const storedArray = JSON.parse(storedArrayJSON);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // 每頁顯示的收益數量
  let analysisArray = [];
  let purchased = [];

  const initData = async () => {
    try {
        const response = await axios.get(`${website}/api/reader/records`, {
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
            let expenditure = chapterPrice
            analysisArray.push({
              title: analysis[n].comicTitle + " / " + analysis[n].chapterTitle,
              date: date,
              time: time,
              expenditure: expenditure
            });
        };
        setReaderLogArray(analysisArray);
        if (analysisArray.length === 0) {
          setBeingComic(false);
        }

        const web3 = new Web3(window.ethereum);
        const contract = new web3.eth.Contract(comicData.abi, comicData.address);
        const totCount = await contract.methods.tokenCounter().call();
        for (let i = 0; i < totCount; i++) {
            const data = await contract.methods.nfts(i).call();
            if (data.minter.toLowerCase() !== currentAccount && data.forSale === false) {
              const owner = await contract.methods.ownerOf(i).call();
              if (owner.toLowerCase() === currentAccount) {
                let price = data.price.toString() / 1e18;
                purchased.push({
                    tokenId: data.tokenId.toString(),
                    comicHash: data.comicHash,
                    price: price,
                });
              }
            }
        }
        const comicMap = new Map(storedArray.map(comic => [comic.comicHash, comic]));
        for (const purchase of purchased) {
          const comic = comicMap.get(purchase.comicHash);
          if (comic) {
              purchase.title = comic.title;
          }
        }
        setNFTLogArray(purchased);
        if (purchased.length === 0) {
          setBeingNFT(false);
        }
    } catch (error) {
        console.error('Error fetching records:', error);
    }
  };

  useEffect(() => {
      initData();
  }, [currentAccount]);

  const totalPages = Math.ceil(readerLogArray.length / itemsPerPage);
  const handlePageChange = (page) => {
      setCurrentPage(page);
  };

  // 計算當前頁面的收益切片的起始索引
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentIncome = readerLogArray.slice(startIndex, startIndex + itemsPerPage);
  const currentNFT = NFTLogArray.slice(startIndex, startIndex + itemsPerPage);

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
      <Container className='purchaseHistory pt-5'>
        <Tabs defaultActiveKey="comics" id="tabs">
          <Tab eventKey="comics" title="漫畫">
            {!beingComic &&  
              <Row className='pt-5 justify-content-center'>
                <h1 className="fw-bold text-center">目前尚未購買漫畫!</h1>
              </Row>
            }
            <Row className='pt-4 justify-content-center'>
              <Col className='d-flex justify-content-center chapter-table'>
                <Table size="sm">
                  <thead>
                    <tr>
                      <th className='text-center fw-bold'>交易日期</th>
                      <th className='text-center fw-bold'>漫畫 / 章節</th>
                      <th className='text-center fw-bold'>支出</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentIncome.map((data, index) => (
                      <tr key={index}>
                        <td className='text-center fw-bold'>{data.date}<br />{data.time}</td>
                        <td className='text-center'>{data.title}</td>
                        <td className='text-center'>{data.expenditure}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Col>
            </Row>
            <Row className='pt-4 pb-5 justify-content-center table-button'>
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
          </Tab>
          <Tab eventKey="nft" title="NFT">
            {!beingNFT &&  
              <Row className='pt-5 justify-content-center'>
                <h1 className="fw-bold text-center">目前尚未購買NFT!</h1>
              </Row>
            }
            {/* 複製這裡的內容到 NFT Tab */}
            <Row className='pt-4 justify-content-center'>
              <Col className='d-flex justify-content-center chapter-table'>
                <Table size="sm">
                  <thead>
                    <tr>
                      <th className='text-center fw-bold'>tokenId</th>
                      <th className='text-center fw-bold'>名稱</th>
                      <th className='text-center fw-bold'>支出</th>
                      <th className='text-center fw-bold'>詳情</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentNFT.map((data, index) => (
                      <tr key={index}>
                        <td className='text-center fw-bold'>{data.tokenId}</td>
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
          </Tab>
        </Tabs>
      </Container>
    </>
    
  );
};

export default PurchaseHistory;

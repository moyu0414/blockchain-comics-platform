import React, { useState, useEffect } from 'react';
import { Container, Card, Col, Row, Pagination } from 'react-bootstrap';
import './bootstrap.min.css';
import { Link } from "react-router-dom";
import axios from 'axios';
const website = process.env.REACT_APP_Website;
const API_KEY = process.env.REACT_APP_API_KEY;

function CollectionNft() {
    const [NFT, setNFT] = useState([]);
    const [loading, setLoading] = useState(true);
    const [beingNFT, setBeingNFT] = useState(true);
    const currentAccount = localStorage.getItem("currentAccount");
    const headers = {'api-key': API_KEY};

    const initData = async () => {
        try {
            const response = await axios.get(`${website}/api/nftDetail/isFavorited`, {
                headers: headers,
                params: {
                    currentAccount: currentAccount,
                }
            });
            let collectNFT = response.data;
            if (typeof collectNFT !== 'undefined' && typeof collectNFT.length === 'undefined') {
                setBeingNFT(false);
            } else {
                const fetchImage = async (data) => {
                    const url = data.protoFilename === 1
                        ? `${website}/api/coverFile/${data.filename}/${data.protoFilename}`
                        : `${website}/api/comicIMG/${data.filename}`;
                    const response = await axios.get(url, { responseType: 'blob', headers });
                    data.image = URL.createObjectURL(response.data);
                    data.descTitle = parseAuthorizations(data.description).map(auth => auth.name)[0];
                };
                await Promise.all(collectNFT.map(fetchImage));
                console.log(collectNFT);
                setNFT(collectNFT);
            }
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
                name: name.trim(),
            };
        });
    };
    
    const truncateText = (text, maxLength) => {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };

    const truncateTextForName = (text) => {
        const isChinese = (char) => /[\u4e00-\u9fa5]/.test(char);
        const maxLength = text.split('').some(isChinese) ? 4 : 8;  // 中文4個字、英文8個字
        return truncateText(text, maxLength);
    };


    return (
        <>
            {!loading ? (
                <>
                <Container className='creatorNft'>
                    <Row className='pt-5'>
                        <h3 className="fw-bold">已收藏NFT</h3>
                    </Row>
                    {!beingNFT &&  
                        <Row className='pt-5 justify-content-center'>
                            <h1 className="fw-bold text-center">目前尚未收藏NFT!</h1>
                        </Row>
                    }
                    <Row className='pt-1 pb-5'>
                        {NFT.map((data, index) => (
                            <Col xs={4} md={3} className="pt-3" key={index}>
                                <Link to={`/nftDetail/tokenId${data.tokenId}`}>
                                    <Card className="effect-image-1">
                                    <Card.Img variant="top" src={data.image} alt={`image-${index + 1}`} />
                                    <div className="nftMarket-overlay-owner">{data.tokenId}</div>
                                    <div className="nftMarket-overlay">{truncateTextForName(data.descTitle)}</div>
                                    <Card.Body className="simple-text">
                                        <Card.Text>{data.title}</Card.Text>
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

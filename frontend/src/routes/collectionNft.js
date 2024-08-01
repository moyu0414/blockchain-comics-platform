import React, { useState, useEffect } from 'react';
import { Container, Card, Col, Row, Pagination } from 'react-bootstrap';
import './bootstrap.min.css';
import { Link } from "react-router-dom";
import Web3 from 'web3';
import axios from 'axios';
import comicData from '../contracts/ComicPlatform.json';

function CollectionNft() {
    const [NFT, setNFT] = useState([]);
    const [loading, setLoading] = useState(true);
    const currentAccount = localStorage.getItem("currentAccount");
    const storedArrayJSON = localStorage.getItem('comicDatas');
    const storedArray = JSON.parse(storedArrayJSON);
    let records = [];

    const initData = async () => {
        const web3 = new Web3(window.ethereum);
        const contract = new web3.eth.Contract(comicData.abi, comicData.address);
        try {
            const response = await axios.get('http://localhost:5000/api/nftDetail/isFavorited', {
                params: {
                    currentAccount: currentAccount,
                }
            });
            //console.log(response.data.collectNFT);

            const totCount = await contract.methods.tokenCounter().call();
            for (let i = 0; i < totCount; i++) {
                const data = await contract.methods.nfts(i).call();
                const comicHash = data.comicHash;
                if (response.data.collectNFT?.[comicHash]) {
                    const comicData = response.data.collectNFT[comicHash];
                    const tokenId = `tokenId${data.tokenId.toString()}`;
                    if (comicData.includes(tokenId)) {
                        const descTitle = parseAuthorizations(data.description);
                        const firstName = descTitle[0]?.name || '';
                        const record = {
                            tokenId: tokenId,
                            comicHash: comicHash,
                            descTitle: firstName,
                        };
                        const storedItem = storedArray.find(item => item.comicHash === comicHash);
                        if (storedItem) {
                            const image = `http://localhost:5000/api/comicIMG/${storedItem.filename}`;
                            record.title = storedItem.title;
                            record.image = storedItem.protoFilename
                                ? `http://localhost:5000/api/coverFile/${storedItem.filename}/${storedItem.protoFilename}`
                                : image;
                        }
                        records.push(record);
                    }
                }
            }
            console.log(records);
            setNFT(records);
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


    return (
        <>
            {!loading ? (
                <>
                <Container className='creatorNft'>
                    <Row className='pt-5'>
                    <h3 className="fw-bold">已收藏NFT</h3>
                    </Row>
                    <Row className='pt-1 pb-5'>
                        {NFT.map((data, index) => (
                            <Col xs={4} md={3} className="pt-3" key={index}>
                                <Link to={`/nftDetail/${data.tokenId}`}>
                                    <Card className="effect-image-1">
                                    <Card.Img variant="top" src={data.image} alt={`image-${index + 1}`} />
                                    <div className="nftMarket-overlay">{data.descTitle}</div>
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

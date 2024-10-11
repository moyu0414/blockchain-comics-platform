import React, { useState, useEffect } from 'react';
import { Container, Card, Col, Row, Pagination, OverlayTrigger, Tooltip } from 'react-bootstrap';
import './bootstrap.min.css';
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import axios from 'axios';
const website = process.env.REACT_APP_Website;
const API_KEY = process.env.REACT_APP_API_KEY;

function CollectionNft() {
    const [NFT, setNFT] = useState([]);
    const [loading, setLoading] = useState(true);
    const [beingNFT, setBeingNFT] = useState(true);
    const { t } = useTranslation();
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
            if (typeof collectNFT !== 'undefined' && typeof collectNFT.length === 'undefined' || collectNFT.length === 0) {
                setBeingNFT(false);
            } else {
                const fetchImage = async (data) => {
                    const conditionMet = data.status === true || (data.status === false && data.forSale === 1);
                    if (conditionMet) {
                        const nftImgResponse = await axios.get(`${website}/api/nftIMG/${data.comic_id}/${data.tokenId}`, {
                            responseType: 'blob',
                            headers,
                        });
                        data.image = nftImgResponse.data.type === 'image/jpeg'
                            ? URL.createObjectURL(nftImgResponse.data)
                            : URL.createObjectURL(
                                await (await axios.get(
                                    data.protoFilename === 1
                                        ? `${website}/api/coverFile/${data.comic_id}`
                                        : `${website}/api/comicIMG/${data.comic_id}`,
                                    { responseType: 'blob', headers }
                                )).data
                            );
                        data.names = parseAuthorizations(data.description).map(auth => auth.name);
                        data.price = data.status ? t('已擁有') : `$ ${Object.values(data.price).pop()}`;
                        return data;
                    }
                    return null;
                };
                const validNFTs = (await Promise.all(collectNFT
                    .filter(data => data.status === true || (data.status === false && data.forSale === 1))
                    .map(fetchImage))
                ).filter(result => result !== null);
                //console.log(validNFTs);
                setNFT(validNFTs);
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
                name: t(name.trim()),
            };
        });
    };

    const renderTooltip = (title, names) => (props) => (
        <Tooltip id="button-tooltip" {...props}>
            {title}
            <hr />
            {names.map((name, index) => (
                <div key={index}>{name}</div>
            ))}
        </Tooltip>
    );


    return (
        <>
            {!loading ? (
                <>
                <Container className='creatorNft'>
                    <Row className='pt-5'>
                        <h3 className="fw-bold">{t('已收藏NFT')}</h3>
                    </Row>
                    {!beingNFT &&  
                        <Row className='pt-5 justify-content-center'>
                            <h1 className="fw-bold text-center">{t('目前尚未收藏NFT')}</h1>
                        </Row>
                    }
                    <Row className='pt-1 pb-5'>
                        {NFT.map((data, index) => (
                            <Col xs={4} md={3} className="pt-3" key={index}>
                                <Link to={`/nftDetail/tokenId${data.tokenId}`}>
                                    <Card className="effect-image-1">
                                        <OverlayTrigger placement="top" overlay={renderTooltip(data.title, data.names)}>
                                            <div>
                                                <Card.Img variant="top" src={data.image} alt={`image-${index + 1}`} />
                                                <div className="collectionNft-overlay">
                                                    <span>{data.price}</span>
                                                </div>
                                                <Card.Body className="simple-text">
                                                    <Card.Text className="creatorNft-text">{data.tokenTitle}</Card.Text>
                                                </Card.Body>
                                            </div>
                                        </OverlayTrigger>
                                    </Card>
                                </Link>
                            </Col>
                        ))}
                    </Row>
                </Container>
                </>
            ) : (
                <div className="loading-container">
                    <div>{t('頁面加載中')}</div>
                </div>
            )}
        </>
    );
}

export default CollectionNft;

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Card, Col, Row, Button, Figure,Tabs, Tab, OverlayTrigger, Tooltip } from 'react-bootstrap';
import './bootstrap.min.css';
import { CardImage } from 'react-bootstrap-icons';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import axios from 'axios';
import { sortByTimestamp } from '../index';
const website = process.env.REACT_APP_Website;
const API_KEY = process.env.REACT_APP_API_KEY;

function Bookcase() {
    const [current, setCurrent] = useState([]);
    const [isBuying, setIsBuying] = useState(true);
    const [NFTLogArray, setNFTLogArray] = useState([]);
    const [beingNFT, setBeingNFT] = useState(true);
    const { t } = useTranslation();
    const storedArrayJSON = localStorage.getItem('comicDatas');
    const storedArray = JSON.parse(storedArrayJSON);
    const readingProgress = localStorage.getItem("readingProgress");
    const readingArray = readingProgress ? JSON.parse(readingProgress) : {}; 
    const currentAccount = localStorage.getItem("currentAccount");
    const headers = {'api-key': API_KEY};
    let bookcase = [];
    let fetchedData = [];
    
    const initData = async () => {
        try {
            try {
                const response = await axios.get(`${website}/api/bookcase`, {
                    headers: headers,
                    params: {
                        currentAccount: currentAccount
                    }
                });
                bookcase = response.data;
                const comicMap = new Map(storedArray.map(comic => [comic.comic_id, comic]));
                const readingMap = new Map(Object.entries(readingArray));
                for (const data of bookcase) {
                    const comic = comicMap.get(data.comicHash);
                    if (comic) {
                        const imageResponse = await axios.get(`${website}/api/comicIMG/${comic.comic_id}`, { responseType: 'blob', headers });
                        const image = URL.createObjectURL(imageResponse.data);
                        data.comicID = comic.comicID;
                        data.image = image;
                        const readingValue = readingMap.get(comic.comicID);
                        if (readingValue) {
                            data.chapter = readingValue;
                        };
                    }
                }
                sortByPurchase(bookcase);
                bookcase.sort((a, b) => (a.is_exist > 0) - (b.is_exist > 0));
                //console.log(bookcase);
                setCurrent(bookcase);
            } catch (error) {
                console.error('Error fetching records:', error);
            }
            if (bookcase.length == 0) {
                setIsBuying(false);
            }
        } catch (error) {
            console.error('Error initializing data:', error);
        }
    };

    useEffect(() => {
        initData();
    }, [currentAccount]);

    const handleSelect = async (eventKey) => {
        if (eventKey === "NFT") {
            const nftResponse = await axios.get(`${website}/api/bookcase/nftRecords`, {
                headers: headers,
                params: {
                    currentAccount: currentAccount
                }
            });
            let nftRecords = nftResponse.data;
            const comicMap = new Map(storedArray.map(comic => [comic.comic_id, comic]));
            for (const data of nftRecords) {
                const comic = comicMap.get(data.comicHash);
                if (comic) {
                    const imageResponse = await axios.get(`${website}/api/comicIMG/${comic.comic_id}`, { responseType: 'blob', headers });
                    const image = URL.createObjectURL(imageResponse.data);
                    data.image = image;
                    data.names = parseAuthorizations(data.description).map(auth => auth.name);
                }
            }
            nftRecords.sort((a, b) => (a.is_exist > 0) - (b.is_exist > 0));
            setNFTLogArray(nftRecords);
            if (nftRecords.length === 0) {
              setBeingNFT(false);
            }
        }
    };

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

    function sortByPurchase(array) {
        return array.sort((a, b) => {
            const dateA = new Date(a.purchase_date);
            const dateB = new Date(b.purchase_date);
            return dateB.getTime() - dateA.getTime();  // 降序排序
        });
    }

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
            <Container className='creatorPage bookcase'>
                <Row className="pt-4 align-items-center">
                    <Col>
                        <h3 className="fw-bold">{t('我的書櫃')}</h3>
                    </Col>
                </Row>
                <Tabs defaultActiveKey="profile" onSelect={handleSelect} className="mb-3">
                    <Tab eventKey="home" title={t('最近閱讀')}>
                        {isBuying &&
                            <Row xs={1} md={2}>
                                {current
                                    .filter(data => data.chapter) // 過濾出有 chapter 的數據
                                    .map((data, idx) => (
                                        <Col key={idx} xs={4} md={3}>
                                            <Link to={data.is_exist === 0 ? (`/comicRead/${data.comicID}/${data.chapter}`) : (`/comicDetail/${data.comicID}`)}>
                                                <Card>
                                                    {data.is_exist === 0 && (
                                                        <>
                                                            <Card.Img variant="top" src={data.image} />
                                                            <div className="bookcase-overlay">{data.chapter}</div>
                                                            <Card.Body>
                                                                <Card.Title className='bookcase-read-text'>{data.title}</Card.Title>
                                                            </Card.Body>
                                                        </>
                                                    )}
                                                </Card>
                                            </Link>
                                        </Col>
                                ))}
                            </Row>
                        }
                        {!isBuying &&
                            <div className="loading-container">
                                <div>{t('目前無購買漫畫，請重新刷新')}</div>
                            </div>
                        }
                    </Tab>
                    <Tab eventKey="profile" title={t('最近購買')}>
                        {isBuying &&
                            <Row xs={1} md={2}>
                                {current.map((data, idx) => (
                                    <Col key={idx} xs={4} md={3}>
                                        <Link to={`/comicDetail/${data.comicID}`}>
                                            <Card>
                                                {data.is_exist === 0 ? (
                                                    <Card.Img variant="top" src={data.image} />
                                                ) : (
                                                    <div className="bookcase-position">
                                                        <Card.Img variant="top" src='/piraty.png' />
                                                        <p className="hidden">
                                                            {data.is_exist === 1 ? t('查核中\n暫不開放') : t('盜版漫畫\n已下架')}
                                                        </p>
                                                    </div>
                                                )}
                                                <div className="bookcase-purchase-overlay"></div>
                                                <Card.Body>
                                                    <Card.Title className='bookcase-purchase-text'>{data.title}</Card.Title>
                                                </Card.Body>
                                            </Card>
                                        </Link>
                                    </Col>
                                ))}
                            </Row>
                        }
                        {!isBuying &&
                            <div className="loading-container">
                                <div>{t('目前無購買漫畫，請重新刷新')}</div>
                            </div>
                        }
                    </Tab>
                    <Tab eventKey="NFT" title='NFT'>
                        {beingNFT &&
                            <Row xs={1} md={2}>
                                {NFTLogArray.map((data, idx) => (
                                    <Col key={idx} xs={4} md={3}>
                                        <Link to={`/nftOwner/tokenId${data.tokenId}`}>
                                            <Card>
                                                {data.is_exist === 0 ? (
                                                    <>
                                                        <OverlayTrigger placement="top" overlay={renderTooltip(data.title, data.names)}>
                                                            <Card.Img variant="top" src={data.image} />
                                                        </OverlayTrigger>
                                                        <div className="bookcase-overlay">{data.title}</div>
                                                    </>
                                                ) : (
                                                    <div className="bookcase-position"  style={{marginBottom: "30px"}}>
                                                        <Card.Img variant="top" src='/piraty.png' />
                                                        <p className="hidden">
                                                            {data.is_exist === 1 ? t('查核中\n暫不開放') : t('盜版NFT\n已下架')}
                                                        </p>
                                                    </div>
                                                )}
                                                <Card.Body>
                                                    <Card.Title className='bookcase-read-text'>{data.tokenTitle}</Card.Title>
                                                </Card.Body>
                                            </Card>
                                        </Link>
                                    </Col>
                                ))}
                            </Row>
                        }
                        {!beingNFT &&
                            <div className="loading-container">
                                <div>{t('目前無購買NFT，請重新刷新')}</div>
                            </div>
                        }
                    </Tab>
                </Tabs>
            </Container>
        </>
    );
}

export default Bookcase;

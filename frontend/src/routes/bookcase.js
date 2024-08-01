import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Card, Col, Row, Button, Figure,Tabs, Tab } from 'react-bootstrap';
import './bootstrap.min.css';
import axios from 'axios';
import { sortByTimestamp } from '../index';

function Bookcase() {
    const [current, setCurrent] = useState([]);
    const [isBuying, setIsBuying] = useState(true);
    const storedArrayJSON = localStorage.getItem('comicDatas');
    const storedArray = JSON.parse(storedArrayJSON);
    const readingProgress = localStorage.getItem("readingProgress");
    const readingArray = readingProgress ? JSON.parse(readingProgress) : {}; 
    const currentAccount = localStorage.getItem("currentAccount");
    let bookcase = [];
    let fetchedData = [];
    
    const initData = async () => {
        try {
            try {
                const response = await axios.get('http://localhost:5000/api/bookcase', {
                    params: {
                    currentAccount: currentAccount
                    }
                });
                bookcase = response.data;
                const comicMap = new Map(storedArray.map(comic => [comic.comicHash, comic]));
                const readingMap = new Map(Object.entries(readingArray));
                for (const data of bookcase) {
                    const comic = comicMap.get(data.comicHash);
                    if (comic) {
                        const image = `http://localhost:5000/api/comicIMG/${comic.filename}`;
                        data.comicID = comic.comicID;
                        data.image = image;
                        const readingValue = readingMap.get(comic.comicID);
                        if (readingValue) {
                            data.chapter = readingValue;
                        }
                    }
                }
                sortByPurchase(bookcase);
                console.log(bookcase);
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

    function sortByPurchase(array) {
        return array.sort((a, b) => {
            const dateA = new Date(a.purchase_date);
            const dateB = new Date(b.purchase_date);
            return dateB.getTime() - dateA.getTime();  // 降序排序
        });
    }

    
    return (
        <>
            <Container className='creatorPage'>
                <Row className="pt-5 align-items-center">
                    <Col>
                        <h3 className="fw-bold">我的書櫃</h3>
                    </Col>
                </Row>
                <Tabs defaultActiveKey="profile" id="uncontrolled-tab-example" className="mb-3">
                    <Tab eventKey="home" title="最近閱讀">
                        {isBuying &&
                            <Row xs={1} md={2} className="g-4 pb-5">
                                {current
                                    .filter(data => data.chapter) // 過濾出有 chapter 的數據
                                    .map((data, idx) => (
                                    <Col key={idx} xs={4} md={3} className="pt-3">
                                        <Link to={`/comicRead/${data.comicID}/${data.chapter}`}>
                                        <Card>
                                            <Card.Img variant="top" src={data.image} />
                                            <div className="bookcase-overlay">{data.chapter}</div>
                                            <Card.Body>
                                            <Card.Title className='bookcase-text'>{data.title}</Card.Title>
                                            </Card.Body>
                                        </Card>
                                        </Link>
                                    </Col>
                                ))}
                            </Row>
                        }
                        {!isBuying &&
                            <div className="loading-container">
                                <div>目前無購買漫畫，請重新刷新...</div>
                            </div>
                        }
                    </Tab>
                    <Tab eventKey="profile" title="最近購買">
                        {isBuying &&
                            <Row xs={1} md={2} className="g-4 pb-5">
                                {current.map((data, idx) => (
                                    <Col key={idx} xs={4} md={3} className="pt-3">
                                        <Link to={`/comicDetail/${data.comicID}`}>
                                            <Card>
                                                <Card.Img variant="top" src={data.image} />
                                                <Card.Body>
                                                    <Card.Title className='text-center'>{data.title}</Card.Title>
                                                </Card.Body>
                                            </Card>
                                        </Link>
                                    </Col>
                                ))}
                            </Row>
                        }
                        {!isBuying &&
                            <div className="loading-container">
                                <div>目前無購買漫畫，請重新刷新...</div>
                            </div>
                        }
                    </Tab>
                </Tabs>
            </Container>
        </>
    );
}

export default Bookcase;

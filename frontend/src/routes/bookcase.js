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
    const currentAccount = localStorage.getItem("currentAccount");
    let bookcase = [];
    let fetchedData = [];
    
    const initData = async () => {
        try {
            const storedArray = JSON.parse(storedArrayJSON);
            try {
                const response = await axios.get('http://localhost:5000/api/bookcase', {
                    params: {
                    currentAccount: currentAccount
                    }
                });
                bookcase = response.data;

                for (var i = 0; i < bookcase.length; i++) {
                    if (bookcase[i].purchase_date) {
                        let comicID = "Comic" + (i+1);
                        const filename = bookcase[i].filename;
                        const image = "http://localhost:5000/api/comicIMG/" + filename;
                        fetchedData.push({ comicID: comicID, title: bookcase[i].title, image: image, purchase_date: bookcase[i].purchase_date});
                    }
                }
                sortByPurchase(fetchedData);
                console.log(fetchedData);
                setCurrent(fetchedData);
            } catch (error) {
                console.error('Error fetching records:', error);
            }
            if (fetchedData.length == 0) {
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


    const recentRead = [
        { title: '最近閱讀漫畫 1', image: 'https://via.placeholder.com/150x200' },
        { title: '最近閱讀漫畫 2', image: 'https://via.placeholder.com/150x200' },
        { title: '最近閱讀漫畫 3', image: 'https://via.placeholder.com/150x200' },
        { title: '最近閱讀漫畫 4', image: 'https://via.placeholder.com/150x200' },
        { title: '最近閱讀漫畫 5', image: 'https://via.placeholder.com/150x200' },
        { title: '最近閱讀漫畫 6', image: 'https://via.placeholder.com/150x200' },
        { title: '最近閱讀漫畫 7', image: 'https://via.placeholder.com/150x200' },
        { title: '最近閱讀漫畫 8', image: 'https://via.placeholder.com/150x200' }
    ];


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
                                {recentRead.map((data, idx) => (
                                    <Col key={idx} xs={4} md={3} className="pt-3">
                                        <Card>
                                            <Card.Img variant="top" src={data.image} />
                                            <Card.Body>
                                                <Card.Title className='text-center'>{data.title}</Card.Title>
                                            </Card.Body>
                                        </Card>
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

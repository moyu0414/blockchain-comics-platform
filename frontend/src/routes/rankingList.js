import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, ListGroup, ListGroupItem, Tabs, Tab } from 'react-bootstrap';
import axios from 'axios';
const website = process.env.REACT_APP_Website;
const API_KEY = process.env.REACT_APP_API_KEY;

const RankingList = () => {
    const [totRankDatas, setTotRankDatas] = useState([]);
    const [purRank, setPurRank] = useState([]);
    const [favRank, setFavRank] = useState([]);
    const [loading, setLoading] = useState(true);
    const storedArrayJSON = localStorage.getItem('comicDatas');
    const storedArray = JSON.parse(storedArrayJSON);
    const headers = {'api-key': API_KEY};



    const initData = async () => {
        try {
            const response = await axios.get(`${website}/api/rankingList/top10`, { headers });
            let rankDatas = response.data;
            if (rankDatas.length > 0) {
                try {
                    const rankInfo = await Promise.all(rankDatas.map(async (data) => {
                        const url = `${website}/api/comicIMG/${data.filename}`;
                        const response = await axios.get(url, { responseType: 'blob', headers });
                        const filename = URL.createObjectURL(response.data);
                        return {
                            ...data,
                            imageUrl: filename
                        };
                    }));
                    const updatedFetchedData = rankInfo.map(fetchedItem => {
                        const match = storedArray.find(storedItem => storedItem.comic_id === fetchedItem.comic_id);
                        return { ...fetchedItem, comicID: match ? match.comicID : null };
                    });
                    console.log(updatedFetchedData);
                    setTotRankDatas(updatedFetchedData);
                    setLoading(false);
                } catch (error) {
                    console.error('Error fetching image:', error);
                }
            }
        } catch (error) {
            console.error('Error initializing contract:', error);
        }
    };

    useEffect(() => {
        initData();
    }, []);

    useEffect(() => {
        const rankings = document.querySelectorAll('.ranking');
        const animationOrder = [1, 0, 2];
        animationOrder.forEach((index, orderIndex) => {
          const el = rankings[index];
          if (el) {
            setTimeout(() => {
              el.classList.add('slideInUp');
            }, 300 * orderIndex);
          }
        });
    }, [totRankDatas]);

    const handleTabSelect = (key) => {
        if (key === 'purchaseRank') {
            purchaseRank();
        } else if (key === 'favoriteRank') {
            favoriteRank();
        }
    };

    const purchaseRank = async () => {
        const response = await axios.get(`${website}/api/rankingList/purRank`, { headers });
        let rankDatas = response.data;
        try {
            const rankInfo = await Promise.all(rankDatas.map(async (data) => {
                const url = `${website}/api/comicIMG/${data.filename}`;
                const response = await axios.get(url, { responseType: 'blob', headers });
                const filename = URL.createObjectURL(response.data);
                return {
                    ...data,
                    imageUrl: filename
                };
            }));
            const updatedFetchedData = rankInfo.map(fetchedItem => {
                const match = storedArray.find(storedItem => storedItem.comic_id === fetchedItem.comic_id);
                return { ...fetchedItem, comicID: match ? match.comicID : null };
            });
            //console.log(updatedFetchedData);
            setPurRank(updatedFetchedData);
        } catch (error) {
            console.error('Error fetching image:', error);
        }
    };

    const favoriteRank = async () => {
        const response = await axios.get(`${website}/api/rankingList/favoriteRank`, { headers });
        let rankDatas = response.data;
        try {
            const rankInfo = await Promise.all(rankDatas.map(async (data) => {
                const url = `${website}/api/comicIMG/${data.filename}`;
                const response = await axios.get(url, { responseType: 'blob', headers });
                const filename = URL.createObjectURL(response.data);
                return {
                    ...data,
                    imageUrl: filename
                };
            }));
            const updatedFetchedData = rankInfo.map(fetchedItem => {
                const match = storedArray.find(storedItem => storedItem.comic_id === fetchedItem.comic_id);
                return { ...fetchedItem, comicID: match ? match.comicID : null };
            });
            //console.log(updatedFetchedData);
            setFavRank(updatedFetchedData);
        } catch (error) {
            console.error('Error fetching image:', error);
        }
    };

    const showAccount = (account) => {
        const prefix = account.substring(0, 9);
        const suffix = account.substring(account.length - 8);
        return `${prefix}...${suffix}`;
    };

    const rankings  = [
        {
            rank: 1,
            comicTitle: "作品名稱",
            comicAuthor: "作者帳號",
            description: "描述描述描述描述描述描述描述描述描述描述",
            imageUrl: "https://images.pexels.com/photos/7809122/pexels-photo-7809122.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
        },
        {
            rank: 2,
            comicTitle: "作品名稱",
            comicAuthor: "作者帳號",
            description: "描述描述描述描述描述描述描述描述描述描述",
            imageUrl: "https://images.pexels.com/photos/7809122/pexels-photo-7809122.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
        },
        {
            rank: 3,
            comicTitle: "作品名稱",
            comicAuthor: "作者帳號",
            description: "描述描述描述描述描述描述描述描述描述描述",
            imageUrl: "https://images.pexels.com/photos/7809122/pexels-photo-7809122.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
        },
        {
            rank: 4,
            comicTitle: "作品名稱",
            comicAuthor: "作者帳號",
            description: "描述描述描述描述描述描述描述描述描述描述",
            imageUrl: "https://images.pexels.com/photos/7809122/pexels-photo-7809122.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
        },
        {
            rank: 5,
            comicTitle: "作品名稱",
            comicAuthor: "作者帳號",
            description: "描述描述描述描述描述描述描述描述描述描述",
            imageUrl: "https://images.pexels.com/photos/7809122/pexels-photo-7809122.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
        }
    ];

    return (
        <>
        {!loading &&
            <Container className="rankingList">
                <Row className="d-flex flex-wrap justify-content-center mt-5 ranking-section">
                    <Col sm={4} className="ranking r2 animated mb-5">
                        <Card>
                            <Card.Header className="header">
                                <h3>{totRankDatas[1].title}</h3>
                            </Card.Header>
                            <Link to={`/comicDetail/${totRankDatas[1].comicID}`}>
                                <Card.Body className="ranking-content">
                                    <img src={totRankDatas[1].imageUrl} alt="Segundo Lugar" className="ranking-image" />
                                    <div className="place">2</div>
                                </Card.Body>
                            </Link>
                        </Card>
                    </Col>
                    <Col sm={4} className="ranking r1 animated first mb-5">
                        <Card>
                            <Card.Header className="header">
                                <h3>{totRankDatas[0].title}</h3>
                            </Card.Header>
                            <Link to={`/comicDetail/${totRankDatas[0].comicID}`}>
                                <Card.Body className="ranking-content">
                                    <img src={totRankDatas[0].imageUrl} alt="Primer Lugar" className="ranking-image" />
                                    <div className="place">1</div>
                                </Card.Body>
                            </Link>
                        </Card>
                    </Col>
                    <Col sm={4} className="ranking r3 animated mb-5">
                        <Card>
                            <Card.Header className="header">
                                <h3>{totRankDatas[2].title}</h3>
                            </Card.Header>
                            <Link to={`/comicDetail/${totRankDatas[2].comicID}`}>
                                <Card.Body className="ranking-content">
                                    <img src={totRankDatas[2].imageUrl} alt="Tercer Lugar" className="ranking-image" />
                                    <div className="place">3</div>
                                </Card.Body>
                            </Link>
                        </Card>
                    </Col>
                </Row>

                <Tabs defaultActiveKey="totalRank" className="mb-3" onSelect={handleTabSelect}>
                    <Tab eventKey="totalRank" title="總排行">
                        <ListGroup>
                            {totRankDatas.map((item, index) => (
                                <Link to={`/comicDetail/${item.comicID}`}>
                                    <ListGroup.Item key={index} className="d-flex align-items-center ranking-list">
                                        <span className="ranking-badge">{index + 1}</span>
                                            <div className="ranking-image">
                                                <img src={item.imageUrl} alt={item.title} className="ranking-thumbnail" />
                                            </div>
                                            <div className="ranking-card-info ms-3">
                                                <div className="ranking-title">{item.title}</div>
                                                <div className="ranking-author">{item.creator}</div>
                                                <p className="ranking-description">{item.description}</p>
                                            </div>
                                    </ListGroup.Item>
                                </Link>
                            ))}
                        </ListGroup>
                    </Tab>
                    <Tab eventKey="purchaseRank" title="人氣排行">
                        <ListGroup>
                            {purRank.map((item, index) => (
                                <Link to={`/comicDetail/${item.comicID}`}>
                                    <ListGroup.Item key={index} className="d-flex align-items-center ranking-list">
                                        <span className="ranking-badge">{index + 1}</span>
                                        <div className="ranking-image">
                                            <img src={item.imageUrl} alt={item.title} className="ranking-thumbnail" />
                                        </div>
                                        <div className="ranking-card-info ms-3">
                                            <div className="ranking-title">{item.title}</div>
                                            <div className="ranking-author">{item.creator}</div>
                                            <p className="ranking-description">{item.description}</p>
                                        </div>
                                    </ListGroup.Item>
                                </Link>
                            ))}
                        </ListGroup>
                    </Tab>
                    <Tab eventKey="favoriteRank" title="愛心排行">
                        <ListGroup>
                            {favRank.map((item, index) => (
                                <Link to={`/comicDetail/${item.comicID}`}>
                                    <ListGroup.Item key={index} className="d-flex align-items-center ranking-list">
                                        <span className="ranking-badge">{index + 1}</span>
                                        <div className="ranking-image">
                                            <img src={item.imageUrl} alt={item.title} className="ranking-thumbnail" />
                                        </div>
                                        <div className="ranking-card-info ms-3">
                                            <div className="ranking-title">{item.title}</div>
                                            <div className="ranking-author">{item.creator}</div>
                                            <p className="ranking-description">{item.description}</p>
                                        </div>
                                    </ListGroup.Item>
                                </Link>
                            ))}
                        </ListGroup>
                    </Tab>





                    <Tab eventKey="weekRank" title="週排行">
                        <ListGroup>
                            {rankings.map((item, index) => (
                                <ListGroup.Item key={index} className="d-flex align-items-center ranking-list">
                                    <span className="ranking-badge">{item.rank}</span>
                                    <div className="ranking-image">
                                        <img src={item.imageUrl} alt={item.comicTitle} className="ranking-thumbnail" />
                                    </div>
                                    <div className="ranking-card-info ms-3">
                                        <div className="ranking-title">{item.comicTitle}</div>
                                        <div className="ranking-author">{item.comicAuthor}</div>
                                        <p className="ranking-description">{item.description}</p>
                                    </div>
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                    </Tab>
                </Tabs>
            </Container>
        }
        {loading &&  
            <div className="loading-container">
                <div>頁面加載中，請稍後...</div>
            </div>
        }
        </>
    );
};

export default RankingList;

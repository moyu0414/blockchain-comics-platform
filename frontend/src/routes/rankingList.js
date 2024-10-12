import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, ListGroup, ListGroupItem, Tabs, Tab, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import axios from 'axios';
const website = process.env.REACT_APP_Website;
const API_KEY = process.env.REACT_APP_API_KEY;

const RankingList = () => {
    const [totRankDatas, setTotRankDatas] = useState([]);
    const [purRank, setPurRank] = useState([]);
    const [favRank, setFavRank] = useState([]);
    const [weekData, setWeekData] = useState([]);
    const [newData, setNewData] = useState([]);
    const [loading, setLoading] = useState(true);
    const { t } = useTranslation();
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
                        const url = `${website}/api/comicIMG/${data.comic_id}`;
                        const response = await axios.get(url, { responseType: 'blob', headers });
                        const image = URL.createObjectURL(response.data);
                        return {
                            ...data,
                            imageUrl: image
                        };
                    }));
                    const updatedFetchedData = rankInfo.map(fetchedItem => {
                        const match = storedArray.find(storedItem => storedItem.comic_id === fetchedItem.comic_id);
                        return { 
                            ...fetchedItem, 
                            comicID: match ? match.comicID : null, 
                            penName: match && match.penName ? match.penName : null
                        };
                    });
                    //console.log(updatedFetchedData);
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
        } else if (key === 'weekRank') {
            weekRank();
        } else if (key === 'newRank') {
            newRank();
        }
    };

    const purchaseRank = async () => {
        const response = await axios.get(`${website}/api/rankingList/purRank`, { headers });
        let rankDatas = response.data;
        try {
            const rankInfo = await Promise.all(rankDatas.map(async (data) => {
                const url = `${website}/api/comicIMG/${data.comic_id}`;
                const response = await axios.get(url, { responseType: 'blob', headers });
                const image = URL.createObjectURL(response.data);
                return {
                    ...data,
                    imageUrl: image
                };
            }));
            const updatedFetchedData = rankInfo.map(fetchedItem => {
                const match = storedArray.find(storedItem => storedItem.comic_id === fetchedItem.comic_id);
                return { 
                    ...fetchedItem, 
                    comicID: match ? match.comicID : null, 
                    penName: match && match.penName ? match.penName : null
                };
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
                const url = `${website}/api/comicIMG/${data.comic_id}`;
                const response = await axios.get(url, { responseType: 'blob', headers });
                const image = URL.createObjectURL(response.data);
                return {
                    ...data,
                    imageUrl: image
                };
            }));
            const updatedFetchedData = rankInfo.map(fetchedItem => {
                const match = storedArray.find(storedItem => storedItem.comic_id === fetchedItem.comic_id);
                return { 
                    ...fetchedItem, 
                    comicID: match ? match.comicID : null, 
                    penName: match && match.penName ? match.penName : null
                };
            });
            //console.log(updatedFetchedData);
            setFavRank(updatedFetchedData);
        } catch (error) {
            console.error('Error fetching image:', error);
        }
    };

    const weekRank = async () => {
        const response = await axios.get(`${website}/api/rankingList/weekRank`, { headers });
        let rankDatas = response.data;
        try {
            const rankInfo = await Promise.all(rankDatas.map(async (data) => {
                const url = `${website}/api/comicIMG/${data.comic_id}`;
                const response = await axios.get(url, { responseType: 'blob', headers });
                const image = URL.createObjectURL(response.data);
                return {
                    ...data,
                    imageUrl: image
                };
            }));
            const updatedFetchedData = rankInfo.map(fetchedItem => {
                const match = storedArray.find(storedItem => storedItem.comic_id === fetchedItem.comic_id);
                return { 
                    ...fetchedItem, 
                    comicID: match ? match.comicID : null, 
                    penName: match && match.penName ? match.penName : null
                };
            });
            //console.log(updatedFetchedData);
            setWeekData(updatedFetchedData);
        } catch (error) {
            console.error('Error fetching image:', error);
        }
    };

    const newRank = async () => {
        const response = await axios.get(`${website}/api/rankingList/newRank`, { headers });
        let rankDatas = response.data;
        try {
            const rankInfo = await Promise.all(rankDatas.map(async (data) => {
                const url = `${website}/api/comicIMG/${data.comic_id}`;
                const response = await axios.get(url, { responseType: 'blob', headers });
                const image = URL.createObjectURL(response.data);
                return {
                    ...data,
                    imageUrl: image
                };
            }));
            const updatedFetchedData = rankInfo.map(fetchedItem => {
                const match = storedArray.find(storedItem => storedItem.comic_id === fetchedItem.comic_id);
                return { 
                    ...fetchedItem, 
                    comicID: match ? match.comicID : null, 
                    penName: match && match.penName ? match.penName : null,
                    date: match.date
                };

            });
            //console.log(updatedFetchedData);
            setNewData(updatedFetchedData);
        } catch (error) {
            console.error('Error fetching image:', error);
        }
    };

    const TooltipWrapper = ({ text, children }) => (
        <OverlayTrigger 
            placement="top" 
            overlay={<Tooltip id="tooltip">{text}</Tooltip>}
        >
            {children}
        </OverlayTrigger>
    );

    const tooltips = {
        totalRank: t('購買數量和收藏數量加總排序'),
        purchaseRank: t('購買數量'),
        favoriteRank: t('收藏數量'),
        weekRank: t('7日內的購買數量'),
        newRank: t('漫畫最新發布')
    };

    const showAccount = (account) => {
        const prefix = account.substr(0, 5);
        const suffix = account.substr(36, 40);
        return prefix + "..." + suffix;
    };


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
                    <Tab 
                        eventKey="totalRank" 
                        title={
                            <TooltipWrapper text={tooltips.totalRank}>
                                <div>{t('總排行')}</div>
                            </TooltipWrapper>
                        }
                    >
                        <ListGroup >
                            {totRankDatas.map((item, index) => (
                                <Link to={`/comicDetail/${item.comicID}`} key={index}>
                                    <ListGroup.Item className="d-flex align-items-center ranking-list">
                                        <span className="ranking-badge">{index + 1}</span>
                                            <div className="ranking-image ranking-thumbnail-position">
                                                <img src={item.imageUrl} alt={item.title} className="ranking-thumbnail" />
                                                <div className="rankingList-overlay">{item.total}</div>
                                            </div>
                                            <div className="ranking-card-info ms-3">
                                                <div className="ranking-title">{item.title}</div>
                                                <div className="ranking-author">{item.penName}({showAccount(item.creator)})</div>
                                                <p className="ranking-description">{item.description}</p>
                                            </div>
                                    </ListGroup.Item>
                                </Link>
                            ))}
                        </ListGroup>
                    </Tab>
                    <Tab 
                        eventKey="purchaseRank" 
                        title={
                            <TooltipWrapper text={tooltips.purchaseRank}>
                                <div>{t('暢銷榜')}</div>
                            </TooltipWrapper>
                        }
                    >
                        <ListGroup>
                            {purRank.map((item, index) => (
                                <Link to={`/comicDetail/${item.comicID}`} key={index}>
                                    <ListGroup.Item className="d-flex align-items-center ranking-list">
                                        <span className="ranking-badge">{index + 1}</span>
                                        <div className="ranking-image ranking-thumbnail-position">
                                            <img src={item.imageUrl} alt={item.title} className="ranking-thumbnail" />
                                            <div className="rankingList-overlay">{item.totBuy}</div>
                                        </div>
                                        <div className="ranking-card-info ms-3">
                                            <div className="ranking-title">{item.title}</div>
                                            <div className="ranking-author">{item.penName}({showAccount(item.creator)})</div>
                                            <p className="ranking-description">{item.description}</p>
                                        </div>
                                    </ListGroup.Item>
                                </Link>
                            ))}
                        </ListGroup>
                    </Tab>
                    <Tab 
                        eventKey="favoriteRank" 
                        title={
                            <TooltipWrapper text={tooltips.favoriteRank}>
                                <div>{t('愛心榜')}</div>
                            </TooltipWrapper>
                        }
                    >
                        <ListGroup>
                            {favRank.map((item, index) => (
                                <Link to={`/comicDetail/${item.comicID}`} key={index}>
                                    <ListGroup.Item className="d-flex align-items-center ranking-list">
                                        <span className="ranking-badge">{index + 1}</span>
                                        <div className="ranking-image ranking-thumbnail-position">
                                            <img src={item.imageUrl} alt={item.title} className="ranking-thumbnail" />
                                            <div className="rankingList-overlay">{item.totHearts}</div>
                                        </div>
                                        <div className="ranking-card-info ms-3">
                                            <div className="ranking-title">{item.title}</div>
                                            <div className="ranking-author">{item.penName}({showAccount(item.creator)})</div>
                                            <p className="ranking-description">{item.description}</p>
                                        </div>
                                    </ListGroup.Item>
                                </Link>
                            ))}
                        </ListGroup>
                    </Tab>
                    <Tab 
                        eventKey="weekRank" 
                        title={
                            <TooltipWrapper text={tooltips.weekRank}>
                                <div>{t('週排行')}</div>
                            </TooltipWrapper>
                        }
                    >
                        <ListGroup>
                            {weekData.map((item, index) => (
                                <Link to={`/comicDetail/${item.comicID}`} key={index}>
                                    <ListGroup.Item className="d-flex align-items-center ranking-list">
                                        <span className="ranking-badge">{index + 1}</span>
                                        <div className="ranking-image ranking-thumbnail-position">
                                            <img src={item.imageUrl} alt={item.title} className="ranking-thumbnail" />
                                            <div className="rankingList-overlay">{item.totBuy}</div>
                                        </div>
                                        <div className="ranking-card-info ms-3">
                                            <div className="ranking-title">{item.title}</div>
                                            <div className="ranking-author">{item.penName}({showAccount(item.creator)})</div>
                                            <p className="ranking-description">{item.description}</p>
                                        </div>
                                    </ListGroup.Item>
                                </Link>
                            ))}
                        </ListGroup>
                    </Tab>
                    <Tab 
                        eventKey="newRank" 
                        title={
                            <TooltipWrapper text={tooltips.newRank}>
                                <div>{t('新上市')}</div>
                            </TooltipWrapper>
                        }
                    >
                        <ListGroup>
                            {newData.map((item, index) => (
                                <Link to={`/comicDetail/${item.comicID}`} key={index}>
                                    <ListGroup.Item className="d-flex align-items-center ranking-list">
                                        <span className="ranking-badge">{index + 1}</span>
                                        <div className="ranking-image ranking-thumbnail-position">
                                            <img src={item.imageUrl} alt={item.title} className="ranking-thumbnail" />
                                            <div className="rankingList-createTime">{item.date}</div>
                                        </div>
                                        <div className="ranking-card-info ms-3">
                                            <div className="ranking-title">{item.title}</div>
                                            <div className="ranking-author">{item.penName}({showAccount(item.creator)})</div>
                                            <p className="ranking-description">{item.description}</p>
                                        </div>
                                    </ListGroup.Item>
                                </Link>
                            ))}
                        </ListGroup>
                    </Tab>
                </Tabs>
            </Container>
        }
        {loading &&  
            <div className="loading-container">
                <div>{t('頁面加載中')}</div>
            </div>
        }
        </>
    );
};

export default RankingList;

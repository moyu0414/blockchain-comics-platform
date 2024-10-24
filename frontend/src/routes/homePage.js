import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Carousel, Card, Col, Row, Button } from 'react-bootstrap';
import './bootstrap.min.css';
import { HeartFill, CartFill } from 'react-bootstrap-icons';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import axios from 'axios';
const website = process.env.REACT_APP_Website;
const API_KEY = process.env.REACT_APP_API_KEY;

const HomePage = () => {
    const [current, setCurrent] = useState([]);
    const [promoPosition, setPromoPosition] = useState([]);
    const [loading, setLoading] = useState(true);
    const { t } = useTranslation();
    const storedArrayJSON = localStorage.getItem('comicDatas');
    const storedArray = JSON.parse(storedArrayJSON);
    const headers = {'api-key': API_KEY};
    
    const initData = async () => {
        try {
            const response = await axios.get(`${website}/api/homepage/updateStats`, { headers });
            let comics = response.data;
            //console.log(comics);
            const totalCountMap = comics.reduce((map, comic) => {
                map[comic.comic_id] = {
                    totHearts: comic.totHearts, // 收藏数
                    totBuy: comic.totBuy // 购买数
                };
                return map;
            }, {});
            const updatedFetchedData = storedArray.map(data => ({
                ...data,
                ...totalCountMap[data.comic_id],
                total: (totalCountMap[data.comic_id]?.totHearts || 0) + (totalCountMap[data.comic_id]?.totBuy || 0)
            }));
            const filteredData = updatedFetchedData.filter(data => data.is_exist === 0);

            const categoryCounts = {};
            filteredData.forEach(data => {
                categoryCounts[data.category] = (categoryCounts[data.category] || 0) + 1;
            });
            const promoCategories = Object.keys(categoryCounts)
                .sort((a, b) => categoryCounts[b] - categoryCounts[a])
                .slice(0, 4); 
            setPromoPosition(promoCategories);
            const fetchComicData = async (comic) => {
                if (promoCategories.includes(comic.category)) {
                    try {
                        const imageResponse = await axios.get(`${website}/api/comicIMG/${comic.comic_id}`, { responseType: 'blob', headers });
                        comic.image = URL.createObjectURL(imageResponse.data); // Set the comic image URL
            
                        if (comic.protoFilename === 1) {
                            const protoFilenameResponse = await axios.get(`${website}/api/coverFile/${comic.comic_id}`, { responseType: 'blob', headers });
                            comic.protoFilename = URL.createObjectURL(protoFilenameResponse.data); // Set the proto image URL
                        }
                    } catch (error) {
                        console.error('Error fetching comic image path:', error);
                    }
                }
            };
            await Promise.all(filteredData.map(fetchComicData));
            filteredData.sort((a, b) => b.total - a.total);
            //console.log(filteredData);
            setCurrent(filteredData);
            setLoading(false);
        } catch (error) {
            console.error('Error initializing contract:', error);
        }
    };

    useEffect(() => {
        initData();
    }, []);
    
    const buttonData = [
        '戀愛', '懸疑', '恐怖', '冒險',
        '古風', '玄幻', '武俠', '搞笑',
    ];

    const handleCategoryClick = (category) => {
        localStorage.setItem('currentCategory', category);
    };


    return (
        <>
            {!loading &&
                <Container className='homepage pt-2'>
                    <Carousel>
                        {promoPosition.map(category => {
                            // max(前4個類型)，取第1個輪播
                            const firstItem = current.find(data => data.category === category);
                            if (firstItem) {
                                const imageUrl = firstItem.protoFilename ? firstItem.protoFilename : firstItem.image;
                                return (
                                    <Carousel.Item key={category}>
                                        <Link to={`/comicDetail/${firstItem.comicID}`}>
                                            <div className="carousel-image-container embed-responsive embed-responsive-16by9">
                                                <img
                                                    className="d-block mx-auto img-fluid"
                                                    src={imageUrl}
                                                    alt={`Slide for ${category}`}
                                                />
                                            </div>
                                            <Carousel.Caption className="carousel-caption-custom">
                                                <h3>{firstItem.title}</h3>
                                                <p>{firstItem.description}</p>
                                            </Carousel.Caption>
                                        </Link>
                                    </Carousel.Item>
                                );
                            } else {
                                return null; // 如果沒有找到符合的項目，返回空
                            }
                        })}
                    </Carousel>
        
                    <Row className="pt-5 pb-4 btn-container">
                        {buttonData.map((label, idx) => (
                            <Col key={idx} xs={2} md={2} lg={1} className="pb-1 btn-section">
                                <Button 
                                    variant="outline-dark"
                                    className="custom-button"
                                    onClick={() => handleCategoryClick(t(label))}
                                >
                                    <Link 
                                        to={"/category"}
                                        state={{ from: 'homepage' }}
                                        className="custom-link"
                                    >
                                        {t(label)}
                                    </Link>
                                </Button>
                            </Col>
                        ))}
                    </Row>
                    
                    {promoPosition.map(category => (
                        <div key={category}>
                            <h3 className="fw-bold">{t(category)} {t('漫畫')}</h3>
                            <Carousel interval={null} pause={false} wrap={true} indicators={false} className="comic-carousel">
                                <Carousel.Item>
                                    <div className="carousel-row">
                                        {current.filter(data => data.category === category).map((data, idx) => (
                                            <Col key={idx} xs={6} md={3} className="mx-1">
                                                <Card style={{marginRight: "8%"}} className="ranking-thumbnail-position">
                                                    <Link to={`/comicDetail/${data.comicID}`}>
                                                        <Card.Img variant="top" src={data.image} />
                                                        <div className="homepage-penName">
                                                            {data.penName}<br />
                                                            <CartFill style={{ marginRight: '5px', marginBottom: "3px" }} />
                                                            {data.totBuy}
                                                            <HeartFill style={{ marginLeft: "5px",marginRight: '5px', marginBottom: "3px" }} />
                                                            {data.totHearts}
                                                        </div>
                                                        <div className="card-overlay">
                                                            <h5 style={{marginTop: "15px"}}>{data.title}</h5>
                                                            <p className="card-overlay-penName">{data.penName}</p>
                                                            <hr />
                                                            <p>{data.description}</p>
                                                        </div>
                                                    </Link>
                                                    <Card.Body>
                                                        <Card.Title className='fw-bold text-center'>{data.title}</Card.Title>
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                        ))}
                                    </div>
                                </Carousel.Item>
                            </Carousel>
                        </div>
                    ))}
                </Container>
            }
            {loading &&  
                <div className="loading-container">
                    <div>{t('頁面加載中')}</div>
                </div>
            }
        </>
    );
}

export default HomePage;

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Carousel, Card, Col, Row, Button } from 'react-bootstrap';
import './bootstrap.min.css';
import { HeartFill, CartFill } from 'react-bootstrap-icons';
import axios from 'axios';

const HomePage = ({ contractAddress }) => {
    const [current, setCurrent] = useState([]);
    const [promoPosition, setPromoPosition] = useState([]);
    const storedArrayJSON = localStorage.getItem('comicDatas');
    const fetchedData = [];
    
    const initData = async () => {
        try {
            const storedArray = JSON.parse(storedArrayJSON);
            for (var i = 0; i < storedArray.length; i++) {
                if (storedArray[i].exists == 1) {
                    const filename = storedArray[i].filename;
                    const image = "http://localhost:5000/api/comicIMG/" + filename;
                    let protoFilename;
                    if (storedArray[i].protoFilename == 1) {
                        protoFilename = `http://localhost:5000/api/coverFile/${filename}/${storedArray[i].protoFilename}`;
                    }
                    const text = storedArray[i].description.length > 40 
                        ? storedArray[i].description.slice(0, 40) + '...' 
                        : storedArray[i].description;
                    fetchedData.push({ comicHash: storedArray[i].comicHash, comicID: storedArray[i].comicID, title: storedArray[i].title, text: text, author: storedArray[i].author, category: storedArray[i].category, image: image, protoFilename: protoFilename});
                }
            };
            const categoryCounts = {};
            fetchedData.forEach(data => {
                if (categoryCounts[data.category]) {
                    categoryCounts[data.category]++;
                } else {
                    categoryCounts[data.category] = 1;
                }
            });
            const sortPromo = Object.keys(categoryCounts).sort((a, b) => categoryCounts[b] - categoryCounts[a]);
            setPromoPosition(sortPromo.slice(0, 4));  // / 推廣位只選取前四個類型來顯示
            try {
                const response = await axios.get('http://localhost:5000/api/homepage/updateStats');
                const comics = response.data;  // 获取从后端返回的漫画数据
                console.log(comics);
                const totalCountMap = comics.reduce((map, comic) => {
                    map[comic.comic_id] = {
                        totHearts: comic.totHearts, // 收藏数
                        totBuy: comic.totBuy // 购买数
                    };
                    return map;
                }, {});
                const updatedFetchedData = fetchedData.map(data => ({
                    ...data,
                    totHearts: totalCountMap[data.comicHash]?.totHearts || 0, // 如果没有找到对应的 comic_id，则为 0
                    totBuy: totalCountMap[data.comicHash]?.totBuy || 0 // 如果没有找到对应的 comic_id，则为 0
                }));
                console.log(updatedFetchedData);
                setCurrent(updatedFetchedData);
            } catch (error) {
                console.error('Error fetching records:', error);
            }
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
    

    const truncateText = (text, maxLength) => {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };

    return (
        <>
            <Container className='homepage pt-4'>
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
                                            <p>{firstItem.text}</p>
                                        </Carousel.Caption>
                                    </Link>
                                </Carousel.Item>
                            );
                        } else {
                            return null; // 如果沒有找到符合的項目，返回空
                        }
                    })}
                </Carousel>
    
                <Row className="pt-5 pb-5 btn-container">
                    {buttonData.map((label, idx) => (
                        <Col key={idx} xs={2} md={3} lg={1} className="pb-3 btn-section">
                            <Button 
                                variant="outline-dark"
                                className="custom-button"
                                onClick={() => handleCategoryClick(label)}
                            >
                                <Link 
                                    to={"/category"}
                                    state={{ category: label }}
                                    className="custom-link"
                                >
                                    {label}
                                </Link>
                            </Button>
                        </Col>
                    ))}
                </Row>
                
                {promoPosition.map(category => (
                    <div key={category}>
                        <h3 className="fw-bold">{category} 漫畫</h3>
                        <Carousel interval={null} pause={false} wrap={true} indicators={false} className="comic-carousel">
                            <Carousel.Item>
                                <div className="carousel-row">
                                    {current.filter(data => data.category === category).map((data, idx) => (
                                        <Col key={idx} xs={6} md={3} className="pt-3 mx-1">
                                            <Card>
                                                <Link to={`/comicDetail/${data.comicID}`}>
                                                    <Card.Img variant="top" src={data.image} />
                                                    <div className="category-totcount">
                                                        <CartFill style={{ marginRight: '5px' }} />
                                                        {data.totBuy}<br />
                                                        <HeartFill style={{ marginRight: '5px' }} />
                                                        {data.totHearts}
                                                    </div>
                                                </Link>
                                                <Card.Body>
                                                    <Card.Title className='fw-bold'>{data.title}</Card.Title>
                                                    <Card.Text className='text-secondary'>{data.text}</Card.Text>
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
        </>
    );
}

export default HomePage;

import React, { useState, useEffect } from 'react';
import { Container, Carousel, Card, Col, Row, Button } from 'react-bootstrap';
import axios from 'axios';
import './bootstrap.min.css';

const HomePage = ({ contractAddress }) => {
    const [current, setCurrent] = useState([]);
    const [promoPosition, setPromoPosition] = useState([]);
    const [currentCategory, setCurrentCategory] = useState('');
    const filteredData = current.filter(data => data.category === currentCategory);
    const storedArrayJSON = localStorage.getItem('comicDatas');
    const fetchedData = [];

    const initData = async () => {
        try {
            const storedArray = JSON.parse(storedArrayJSON);
            for (var i = 0; i < storedArray.length; i++) {
                if (storedArray[i].exists == 1) {
                    const filename = storedArray[i].filename;
                    const image = "http://localhost:5000/api/comicIMG/" + filename;
                    fetchedData.push({ comicID: storedArray[i].comicID, title: storedArray[i].title, text: storedArray[i].description, author: storedArray[i].author, category: storedArray[i].category, image: image});
                }
            };
            setCurrent(fetchedData);

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
            console.log(fetchedData);
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
        if (category === currentCategory) {  // 如果點擊的是當前已選中的類型，則取消選擇
            setCurrentCategory('');
        } else {
            setCurrentCategory(category);
        }
    };
    

    return (
        <Container className='homepage'>

            <Carousel>
                {promoPosition.map(category => {
                    // max(前4個類型)，取第1個輪播
                    const firstItem = current.find(data => data.category === category);
                    if (firstItem) {
                        return (
                            <Carousel.Item key={category}>
                                <div className="carousel-image-container embed-responsive embed-responsive-16by9">
                                    <img
                                        className="d-block mx-auto img-fluid"
                                        src={firstItem.image}
                                        alt={`Slide for ${category}`}
                                    />
                                </div>
                                <Carousel.Caption className="carousel-caption-custom">
                                    <h3>{firstItem.title}</h3>
                                    <p>{firstItem.text}</p>
                                </Carousel.Caption>
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
                            {label}
                        </Button>
                    </Col>
                ))}
            </Row>

            {currentCategory && (
                <>
                    {filteredData.length === 0 ? (
                        <>
                            <h3 className="fw-bold">目前沒有{currentCategory}類型的漫畫。</h3>
                            <br />
                        </>
                    ) : (
                        <>
                            <Row>
                                <h3 className="fw-bold">{currentCategory}漫畫</h3>
                            </Row>
                            <Row xs={1} md={2} className="g-4 pb-5">
                                {filteredData.map((data, idx) => (
                                    <Col key={idx} xs={6} md={3} className="pt-3">
                                        <Card>
                                            <Card.Img variant="top" src={data.image} />
                                            <Card.Body>
                                                <Card.Title className='fw-bold'>{data.title}</Card.Title>
                                                <Card.Text className='text-secondary'>{data.text}</Card.Text>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        </>
                    )}
                </>
            )}

            {promoPosition.map(category => (
                <div key={category}>
                    <Row>
                        <h3 className="fw-bold">{category}漫畫</h3>
                    </Row>
                    <Row xs={1} md={2} className="g-4 pb-5">
                        {current.filter(data => data.category === category).map((data, idx) => (
                            <Col key={idx} xs={6} md={3} className="pt-3">
                                <Card>
                                    <Card.Img variant="top" src={data.image} />
                                    <Card.Body>
                                        <Card.Title className='fw-bold'>{data.title}</Card.Title>
                                        <Card.Text className='text-secondary'>{data.text}</Card.Text>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </div>
            ))}
        </Container>
    );
}

export default HomePage;

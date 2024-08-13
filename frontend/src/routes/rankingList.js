import React, { useEffect } from 'react';
import { Container, Row, Col, Card, ListGroup, ListGroupItem } from 'react-bootstrap';

const RankingList = () => {
    useEffect(() => {
        document.querySelectorAll('.ranking').forEach((el, index) => {
            setTimeout(() => {
                el.classList.add('slideInUp');
            }, 300 * (index + 1));
        });
    }, []);

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
        <Container className="rankingList">
            <Row className="d-flex flex-wrap justify-content-center mt-5 ranking-section">
                <Col sm={4} className="ranking r2 animated mb-5">
                    <Card>
                        <Card.Header className="header">
                            <h3>漫畫名稱</h3>
                        </Card.Header>
                        <Card.Body>
                            <div className="ranking-content">
                                <img src="https://images.pexels.com/photos/7809122/pexels-photo-7809122.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" alt="Segundo Lugar" className="ranking-image" />
                                <div className="place">2</div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col sm={4} className="ranking r1 animated first mb-5">
                    <Card>
                        <Card.Header className="header">
                            <h3>漫畫名稱</h3>
                        </Card.Header>
                        <Card.Body>
                            <div className="ranking-content">
                                <img src="https://images.pexels.com/photos/7809122/pexels-photo-7809122.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" alt="Primer Lugar" className="ranking-image" />
                                <div className="place">1</div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col sm={4} className="ranking r3 animated mb-5">
                    <Card>
                        <Card.Header className="header">
                            <h3>漫畫名稱</h3>
                        </Card.Header>
                        <Card.Body>
                            <div className="ranking-content">
                                <img src="https://images.pexels.com/photos/7809122/pexels-photo-7809122.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" alt="Tercer Lugar" className="ranking-image" />
                                <div className="place">3</div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            <Row className='mb-4'>
                <Col md={12}>
                    <h2 className="ranking-list-title">排行榜</h2>
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
                </Col>
            </Row>
        </Container>
    );
};

export default RankingList;

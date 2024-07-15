import React from 'react';
import { Container, Carousel, Card, Col, Row, Button } from 'react-bootstrap';
import './bootstrap.min.css';

function HomePage() {
    const cardData = [
        { title: 'Card 1', text: 'This is the content of Card 1.', image: 'https://via.placeholder.com/150' },
        { title: 'Card 2', text: 'This is the content of Card 2.', image: 'https://via.placeholder.com/150' },
        { title: 'Card 3', text: 'This is the content of Card 3.', image: 'https://via.placeholder.com/150' },
        { title: 'Card 4', text: 'This is the content of Card 4.', image: 'https://via.placeholder.com/150' }
    ];

    const buttonData = [
        '戀愛', '懸疑', '恐怖', '冒險',
        '古風', '玄幻', '武俠', '搞笑',
    ];

    return (
        <Container className='homepage'>
            <Carousel>
                <Carousel.Item>
                    <img
                    className="d-block mx-auto img-fluid"
                    src="https://via.placeholder.com/800x400?text=First+slide"
                    alt="First slide"
                    />
                    <Carousel.Caption className="carousel-caption-custom">
                        <h3>First slide label</h3>
                        <p>Nulla vitae elit libero, a pharetra augue mollis interdum.</p>
                    </Carousel.Caption>
                </Carousel.Item>
                <Carousel.Item>
                    <img
                    className="d-block mx-auto img-fluid"
                    src="https://via.placeholder.com/800x400?text=Second+slide"
                    alt="Second slide"
                    />
                    <Carousel.Caption className="carousel-caption-custom">
                    <h3>Second slide label</h3>
                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                    </Carousel.Caption>
                </Carousel.Item>
                <Carousel.Item>
                    <img
                    className="d-block mx-auto img-fluid"
                    src="https://via.placeholder.com/800x400?text=Third+slide"
                    alt="Third slide"
                    />
                    <Carousel.Caption className="carousel-caption-custom">
                    <h3>Third slide label</h3>
                    <p>Praesent commodo cursus magna, vel scelerisque nisl consectetur.</p>
                    </Carousel.Caption>
                </Carousel.Item>
            </Carousel>

            <Row className="pt-5 pb-5 btn-container">
                {buttonData.map((label, idx) => (
                    <Col key={idx} xs={2} md={3} lg={1} className="pb-3 btn-section">
                        <Button variant="outline-dark" className="custom-button">{label}</Button>
                    </Col>
                ))}
            </Row>
            <Row>
                <h3 className="fw-bold">戀愛漫畫</h3>
                <p className="text-secondary">Romance manga</p>
            </Row>
            <Row xs={1} md={2} className="g-4 pb-5">
                
                {cardData.map((data, idx) => (
                    <Col key={idx} xs={6} md={3} className="pt-3">
                    <Card>
                        <Card.Img variant="top" src={data.image} />
                        <Card.Body>
                            <Card.Title>{data.title}</Card.Title>
                            <Card.Text>{data.text}</Card.Text>
                        </Card.Body>
                    </Card>
                    </Col>
                ))}
            </Row>
            <Row>
                <h3 className="fw-bold">懸疑漫畫</h3>
                <p className="text-secondary">Romance manga</p>
            </Row>
            <Row xs={1} md={2} className="g-4 pb-5">
                
                {cardData.map((data, idx) => (
                    <Col key={idx} xs={6} md={3} className="pt-3">
                    <Card>
                        <Card.Img variant="top" src={data.image} />
                        <Card.Body>
                            <Card.Title>{data.title}</Card.Title>
                            <Card.Text>{data.text}</Card.Text>
                        </Card.Body>
                    </Card>
                    </Col>
                ))}
            </Row>
            <Row>
                <h3 className="fw-bold">古風漫畫</h3>
                <p className="text-secondary">Romance manga</p>
            </Row>
            <Row xs={1} md={2} className="g-4 pb-5">
                
                {cardData.map((data, idx) => (
                    <Col key={idx} xs={6} md={3} className="pt-3">
                    <Card>
                        <Card.Img variant="top" src={data.image} />
                        <Card.Body>
                            <Card.Title>{data.title}</Card.Title>
                            <Card.Text>{data.text}</Card.Text>
                        </Card.Body>
                    </Card>
                    </Col>
                ))}
            </Row>
        </Container>
    );
}

export default HomePage;

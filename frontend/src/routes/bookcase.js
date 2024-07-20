import React from 'react';
import { Container, Card, Col, Row, Button, Figure,Tabs, Tab } from 'react-bootstrap';
import './bootstrap.min.css';
import { Funnel } from 'react-bootstrap-icons';

function Bookcase() {
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

    const recentPurchases = [
        { title: '最近購買漫畫 1', image: 'https://via.placeholder.com/150x200' },
        { title: '最近購買漫畫 2', image: 'https://via.placeholder.com/150x200' },
        { title: '最近購買漫畫 3', image: 'https://via.placeholder.com/150x200' },
        { title: '最近購買漫畫 4', image: 'https://via.placeholder.com/150x200' },
        { title: '最近購買漫畫 5', image: 'https://via.placeholder.com/150x200' },
        { title: '最近購買漫畫 6', image: 'https://via.placeholder.com/150x200' },
        { title: '最近購買漫畫 7', image: 'https://via.placeholder.com/150x200' },
        { title: '最近購買漫畫 8', image: 'https://via.placeholder.com/150x200' }
    ];

    return (
        <Container className='creatorPage'>
            <Row className="pt-5 align-items-center">
                <Col>
                    <h3 className="fw-bold">我的書櫃</h3>
                </Col>
            </Row>
            <Tabs defaultActiveKey="profile" id="uncontrolled-tab-example" className="mb-3">
                <Tab eventKey="home" title="最近閱讀">
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
                </Tab>
                <Tab eventKey="profile" title="最近購買">
                    <Row xs={1} md={2} className="g-4 pb-5">
                        {recentPurchases.map((data, idx) => (
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
                </Tab>
            </Tabs>
        </Container>
    );
}

export default Bookcase;

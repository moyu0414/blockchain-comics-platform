import React, { useState } from 'react';
import { Container, Carousel, Card, Col, Row, Tabs, Tab } from 'react-bootstrap';
import './bootstrap.min.css';
import { Heart, HeartFill } from 'react-bootstrap-icons';
import BootstrapTable from 'react-bootstrap-table-next';

function NftMarket() {

    const images = [
        "https://via.placeholder.com/120x60?text=Image",
        "https://via.placeholder.com/120x60?text=Image",
        "https://via.placeholder.com/120x60?text=Image",
        "https://via.placeholder.com/120x60?text=Image"
    ];




    return (
        
        <Container className='nftMarket'>
            <Row className='pt-5'>
                <h3 className="fw-bold">大家都在買</h3>
            </Row>
            <Row className='pt-1 pb-5'>
                {images.map((src, index) => (
                <Col xs={6} md={3} className="pt-3">
                    <Card className="effect-image-1">
                        <Card.Img variant="top" src={src} alt={`image-${index + 1}`} />
                        <Card.Body className="simple-text">
                            <Card.Text>名稱名稱</Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
                ))}
            </Row>
            <Row className='pt-5'>
                <h3 className="fw-bold">推薦NFT</h3>
            </Row>
            
            <Tabs defaultActiveKey="profile" id="uncontrolled-tab-example" className="mb-3">
                <Tab eventKey="member" title="會員">
                    <Row className='pt-1 pb-5'>
                        {images.map((src, index) => (
                        <Col xs={6} md={3} className="pt-3">
                            <Card className="effect-image-1">
                                <Card.Img variant="top" src={src} alt={`image-${index + 1}`} />
                                <Card.Body className="simple-text">
                                    <Card.Text>名稱名稱</Card.Text>
                                </Card.Body>
                            </Card>
                        </Col>
                        ))}
                    </Row>
                </Tab>
                <Tab eventKey="material" title="素材">
                    <Row className='pt-1 pb-5'>
                        {images.map((src, index) => (
                        <Col xs={6} md={3} className="pt-3">
                            <Card className="effect-image-1">
                                <Card.Img variant="top" src={src} alt={`image-${index + 1}`} />
                                <Card.Body className="simple-text">
                                    <Card.Text>名稱名稱</Card.Text>
                                </Card.Body>
                            </Card>
                        </Col>
                        ))}
                    </Row>
                </Tab>
                <Tab eventKey="copyright" title="版權">
                    <Row className='pt-1 pb-5'>
                        {images.map((src, index) => (
                        <Col xs={6} md={3} className="pt-3">
                            <Card className="effect-image-1">
                                <Card.Img variant="top" src={src} alt={`image-${index + 1}`} />
                                <Card.Body className="simple-text">
                                    <Card.Text>名稱名稱</Card.Text>
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

export default NftMarket;

import React from 'react';
import { Container, Card, Col, Row, Button, Figure } from 'react-bootstrap';
import './bootstrap.min.css';
import { Funnel } from 'react-bootstrap-icons';

const CustomToggle = React.forwardRef(({ onClick }, ref) => (
    <div
        ref={ref}
        onClick={(e) => {
            e.preventDefault();
            onClick(e);
        }}
        style={{ cursor: 'pointer' }}
    >
        <Funnel size={36} />
    </div>
));

function CreatorPage() {
    const cardData = [
        { title: '漫畫 1', image: 'https://via.placeholder.com/150x200' },
        { title: '漫畫 2', image: 'https://via.placeholder.com/150x200' },
        { title: '漫畫 3', image: 'https://via.placeholder.com/150x200' },
        { title: '漫畫 4', image: 'https://via.placeholder.com/150x200' },
        { title: '漫畫 5', image: 'https://via.placeholder.com/150x200' },
        { title: '漫畫 6', image: 'https://via.placeholder.com/150x200' },
        { title: '漫畫 7', image: 'https://via.placeholder.com/150x200' },
        { title: '漫畫 8', image: 'https://via.placeholder.com/150x200' }
    ];

    const buttonData = [
        '收益分析', 'NFT專區', '管理漫畫', 
    ];
    
    

    return (
        <Container className='creatorPage'>
            <Row className="pt-5">
                <Figure>
                    <Figure.Image
                        className="d-block mx-auto img-fluid rounded-circle"
                        alt="400x400"
                        src="https://via.placeholder.com/200x200?text=Banner Image"
                    />
                </Figure>
            </Row>
            <Row className="pt-3 pb-3 btn-container justify-content-center w-100">
                {buttonData.map((label, idx) => (
                    <Col key={idx} xs={2} md={3} lg={1} className="pb-3 btn-section">
                        <Button variant="outline-dark" className="custom-button">{label}</Button>
                    </Col>
                ))}
            </Row>
            <Row className="align-items-center">
                <Col>
                    <h3 className="fw-bold">已經發布</h3>
                </Col>
            </Row>
            <Row xs={1} md={2} className="g-4 pb-5">
                
                {cardData.map((data, idx) => (
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
        </Container>
    );
}

export default CreatorPage;

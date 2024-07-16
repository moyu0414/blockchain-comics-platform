import React from 'react';
import { Container, Carousel, Card, Col, Row, Button, Dropdown } from 'react-bootstrap';
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

function Category() {
    const cardData = [
        { title: '漫畫 1', text: '漫畫 1 描述', image: 'https://via.placeholder.com/150' },
        { title: '漫畫 2', text: '漫畫 2 描述', image: 'https://via.placeholder.com/150' },
        { title: '漫畫 3', text: '漫畫 3 描述', image: 'https://via.placeholder.com/150' },
        { title: '漫畫 4', text: '漫畫 4 描述', image: 'https://via.placeholder.com/150' },
        { title: '漫畫 5', text: '漫畫 5 描述', image: 'https://via.placeholder.com/150' },
        { title: '漫畫 6', text: '漫畫 6 描述', image: 'https://via.placeholder.com/150' },
        { title: '漫畫 7', text: '漫畫 7 描述', image: 'https://via.placeholder.com/150' },
        { title: '漫畫 8', text: '漫畫 8 描述', image: 'https://via.placeholder.com/150' }
    ];

    const buttonData = [
        '戀愛', '懸疑', '恐怖', '冒險',
        '古風', '玄幻', '武俠', '搞笑',
    ];
    
    

    return (
        <Container className='homepage'>
            <Row className="pt-5 pb-5 btn-container">
                {buttonData.map((label, idx) => (
                    <Col key={idx} xs={2} md={3} lg={1} className="pb-3 btn-section">
                        <Button variant="outline-dark" className="custom-button">{label}</Button>
                    </Col>
                ))}
            </Row>
            <Row className="align-items-center">
                <Col>
                    <h3 className="fw-bold">戀愛漫畫</h3>
                </Col>
                <Col xs="auto">
                    <Dropdown>
                        <Dropdown.Toggle as={CustomToggle} />
                        <Dropdown.Menu>
                            <Dropdown.Item href="#">人氣排序</Dropdown.Item>
                            <Dropdown.Item href="#">愛心排序</Dropdown.Item>
                            <Dropdown.Item href="#">新發布</Dropdown.Item>
                            <Dropdown.Item href="#">最近更新</Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                </Col>
            </Row>
            <Row>
                <Col>
                    <p className="text-secondary">Romance manga</p>
                </Col>
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

export default Category;

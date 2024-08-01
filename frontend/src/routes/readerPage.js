import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Col, Row, Button, Figure } from 'react-bootstrap';
import './bootstrap.min.css';
import { Funnel, Heart, FileEarmarkText, Envelope, CardImage, VectorPen } from 'react-bootstrap-icons';

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

function ReaderPage() {
    const buttonData = [
        { label: '我的書櫃', icon: <Heart /> },
        { label: '漫畫收藏', icon: <Heart /> },
        { label: '我的購買', icon: <FileEarmarkText /> },
        { label: '我的訊息', icon: <Envelope /> },
        { label: 'NFT收藏', icon: <CardImage /> },
        { label: '成為作家', icon: <VectorPen /> }
    ];

    const pathMap = {
        '我的書櫃': '/bookcase',
        '漫畫收藏': '/collectionPage',
        '我的購買': '/purchaseHistory',
        '我的訊息': '/messagePage',
        'NFT收藏': '/collectionNft',
        '成為作家': '/becomeWriter'
    };
    

    return (
        <Container className='readerPage'>
            <Row className="pt-5">
                <Figure>
                    <Figure.Image
                        className="d-block mx-auto img-fluid rounded-circle"
                        alt="400x400"
                        src="https://via.placeholder.com/200x200?text=Banner Image"
                    />
                </Figure>
            </Row>
            <h3><center>讀者專區</center></h3>
            <Row className="pt-4 pb-3 btn-container justify-content-center w-100">
                {buttonData.map((item, idx) => (
                    <Col key={idx} xs={6} sm={6} md={3} lg={1} className="pb-3 btn-section">
                        <Link to={pathMap[item.label]}>
                            <Button variant="outline-dark" className="custom-button">
                                <div className="icon-label">
                                    {item.icon}
                                    <span>{item.label}</span>
                                </div>
                            </Button>
                        </Link>
                    </Col>
                ))}
            </Row>
        </Container>
    );
}

export default ReaderPage;

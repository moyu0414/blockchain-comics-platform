import React, { useState } from 'react';
import { Container, Carousel, Card, Col, Row, Button, Dropdown, Figure, Table } from 'react-bootstrap';
import './bootstrap.min.css';
import { Heart, HeartFill } from 'react-bootstrap-icons';
import BootstrapTable from 'react-bootstrap-table-next';

function ComicDetail() {
    const cardData = [
        { title: '漫畫 1', text: '漫畫 1 描述', image: 'https://via.placeholder.com/150' },
        { title: '漫畫 2', text: '漫畫 2 描述', image: 'https://via.placeholder.com/150' },
        { title: '漫畫 3', text: '漫畫 3 描述', image: 'https://via.placeholder.com/150' },
        { title: '漫畫 4', text: '漫畫 4 描述', image: 'https://via.placeholder.com/150' }
    ];

    const buttonData = [
        '開始閱讀', '收藏'
    ];

    
    const current = [
        { title: '漫畫 1', author: '作者 1', chapter: '第 10 章', description: '這是漫畫 1 的描述' }
    ];

    const [isFavorited, setIsFavorited] = useState(false); // 初始状态为未收藏

    const handleFavoriteClick = () => {
        setIsFavorited(!isFavorited); // 切换收藏状态
    };

    const chapters = [
        {title: '章節 1章節 1章節 1章節 1', chapterPrice: '0.01', isBuying: '購買'},
        {title: '章節 2', chapterPrice: '0.02', isBuying: '購買'}
    ]

    return (
        
        <Container className='comicDetail'>
            <Row className="pt-5">
                <Figure>
                    <Figure.Image
                        className="d-block mx-auto img-fluid"
                        alt="800x400"
                        src="https://via.placeholder.com/1200x400?text=Banner Image"
                    />
                </Figure>
            </Row>
            <Row className="pt-2 pb-3 btn-container justify-content-center">
                {buttonData.map((label, idx) => (
                    <Col key={idx} xs={2} md={2} lg={2} className="pb-3 btn-section d-flex justify-content-center">
                        <Button variant="outline-dark" className="custom-button" onClick={label === '收藏' ? handleFavoriteClick : undefined}>
                            {label === '收藏' && (
                                <>
                                    {isFavorited ? (
                                        <HeartFill
                                            className="me-2"
                                            style={{ color: '#F6B93B', cursor: 'pointer' }}
                                            size={20}
                                        />
                                    ) : (
                                        <Heart
                                            className="me-2"
                                            style={{ color: 'black', cursor: 'pointer' }}
                                            size={20}
                                        />
                                    )}
                                </>
                            )}
                            {label}
                        </Button>
                    </Col>
                ))}
            </Row>
            <Row>
                <Col className="text-section">
                    {current.map((comic, index) => (
                        <React.Fragment key={index}>
                            <h3 className="fw-bold">{comic.title}</h3>
                            <p className="text-secondary">{comic.author}</p>
                            <p>最新章節：{comic.chapter}</p>
                            <p className="text-secondary">{comic.description}</p>
                        </React.Fragment>
                    ))}
                </Col>
            </Row>
            <Row className='pt-5 chapter-title-section'>
                <Col className=''>
                    <div className='d-flex justify-content-between align-items-center'>
                        <h3 className='fw-bold mb-0'>章節目錄</h3>
                        <p className='text-end mb-0'>查看全部章節</p>
                    </div>
                    <hr/>
                </Col>
            </Row>
            <Row className='pb-5 justify-content-center'>
                <Col className='d-flex justify-content-center chapter-table'>
                    <Table size="sm">
                        <tbody>
                            {chapters.map((chapter, index) => (
                                <tr key={index}>
                                    <td className='text-center fw-bold'>第 {index + 1} 章</td>
                                    <td className='text-center'>{chapter.title}</td>
                                    <td className='text-center'>{chapter.chapterPrice}</td>
                                    <td className='text-center'>
                                        <button className="btn" value={chapter.isBuying}>{chapter.isBuying}</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Col>
            </Row>
            <Row>
                <h3 className="fw-bold">類似漫畫</h3>
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

export default ComicDetail;

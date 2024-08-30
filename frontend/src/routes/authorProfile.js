import React from 'react';
import { Container, Row, Col, Card, Image } from 'react-bootstrap';

const AuthorProfile = () => {
    return (
        <Container className='authorProfile pt-4'>
            {/* 作者信息 */}
            <Row className="profile my-4 pb-4">
                <Col xs={12} md={4} className="text-center profile-section">
                    {/* 作者头像 */}
                    <img 
                        src="https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                        roundedCircle 
                        fluid 
                        alt="Author"
                    />
                </Col>
                <Col xs={12} md={8} className='profile-text-section'>
                    <Card>
                        <Card.Body>
                            <Card.Title>作者筆名: 作者筆名</Card.Title>
                            <Card.Text>作者帳號: 作者帳號</Card.Text>
                            <Card.Text>作者 Email: xxxxxx@example.com</Card.Text>
                            <Card.Text>作者簡介: 這是一段簡短的作者介紹。</Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* 社交媒體貼文 */}
            <Row className="my-4">
                <Col xs={12}>
                    <Card>
                        <Card.Header>
                            <Row className="align-items-center">
                                <Col xs={2} className='post-author'>
                                    <img 
                                        src="https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                                        roundedCircle 
                                        fluid 
                                        alt="Post Author"
                                    />
                                </Col>
                                <Col xs={10}>
                                    <strong>John Doe</strong>
                                    <p className="mb-0 text-muted">2024年8月30日</p>
                                </Col>
                            </Row>
                        </Card.Header>
                        <Card.Body className='post-section'>
                            <Card.Text>
                                這是一篇貼文訊息的文字內容。
                            </Card.Text>
                            <div className='post-image'>
                                <img 
                                    src="https://images.pexels.com/photos/457882/pexels-photo-457882.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                                    fluid 
                                    alt="Post Image"
                                />
                            </div>
                            
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default AuthorProfile;
import React from 'react';
import { Container, Row, Col, Button, Image } from 'react-bootstrap';
import YesImage from '../image/Yes.png';

const VerifySuccess = () => {
    return (
        <Container className='verifySuccess'>
            <Row className="justify-content-center text-center w-100">
                <Col xs={12} md={8}>
                    <Image 
                    src={YesImage} 
                    alt="圖片" 
                    fluid 
                    rounded 
                    className="mb-4" 
                />
                <div className="mb-3">
                    <h2>驗證成功</h2>
                    <h2>謝謝您成為我們的創作者！</h2>
                    <h4>進入創作者頁面開始我們的旅程吧</h4>
                </div>
                <Button variant="primary">跳轉至創作者專區</Button>
                </Col>
            </Row>
        </Container>
    );
};

export default VerifySuccess;
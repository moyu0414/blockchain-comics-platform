import React from 'react';
import { Container, Row, Col, Button, Image } from 'react-bootstrap';
import HandImage from '../image/hand.png';

const BecomeWriter = () => {
  return (
    <Container className='becomeWriter'>
      <Row className="justify-content-center text-center w-100">
        <Col xs={12} md={8}>
            <Image 
            src={HandImage} 
            alt="示範圖片" 
            fluid 
            rounded 
            className="mb-4" 
          />
          <div className="mb-3">
            <h2>您好～</h2>
            <h3>歡迎您成為我們的創作者！</h3>
            <h4>為了保障我們的讀者與創作者</h4>
            <h4>我們需要進行一些驗證</h4>
          </div>
          <Button variant="primary">開始驗證</Button>
        </Col>
      </Row>
    </Container>
  );
};

export default BecomeWriter;
import React from 'react';
import { Container, Row, Col, Button, Image } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';

const BecomeWriter = () => {
  const { t } = useTranslation();

  
  return (
    <Container className='becomeWriter'>
      <Row className="justify-content-center text-center w-100">
        <Col xs={12} md={8}>
            <Image 
            src="/hand.png"
            alt="image" 
            fluid 
            rounded 
            className="mb-4" 
          />
          <div className="mb-3">
            <h2>{t('您好～')}</h2>
            <h3>{t('歡迎您成為我們的創作者！')}</h3>
            <h4>{t('為了保障我們的讀者與創作者的權益')}</h4>
            <h4>{t('我們需要進行一些驗證')}</h4>
          </div>
          <Link to="/verifyPage">
            <Button variant="primary">{t('開始驗證')}</Button>
          </Link>
        </Col>
      </Row>
    </Container>
  );
};

export default BecomeWriter;
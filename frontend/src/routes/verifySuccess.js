import React from 'react';
import { Container, Row, Col, Button, Image } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';

const VerifySuccess = () => {
    const { t } = useTranslation();

    const handleClick = () => {
        window.location.replace("/creatorPage");
    };


    return (
        <Container className='verifySuccess'>
            <Row className="justify-content-center text-center w-100">
                <Col xs={12} md={8}>
                    <Image 
                    src="/Yes.png"
                    alt="image" 
                    fluid 
                    rounded 
                    className="mb-4" 
                />
                <div className="mb-3">
                    <h2>{t('驗證成功')}</h2>
                    <h2>{t('謝謝您成為我們的創作者！')}</h2>
                    <h4>{t('進入創作者頁面開始我們的旅程吧')}</h4>
                </div>
                <Button onClick={handleClick} variant="primary" style={{width: "200px"}}>{t('創作者專區')}</Button>
                </Col>
            </Row>
        </Container>
    );
};

export default VerifySuccess;
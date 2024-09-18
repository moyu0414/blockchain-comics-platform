import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Col, Row } from 'react-bootstrap';
import { HouseDoor, Grid, Cart, Person, Book } from 'react-bootstrap-icons';
import { useTranslation } from 'react-i18next';
import '../i18n';

function BottomNavbar() {
    const { t } = useTranslation();

    

    return (
        <>
            <Container fluid className="bottom-navigation-bar">
                <Row>
                    <Col>
                        <div className="top-section"></div>
                    </Col>
                </Row>
                <Row className="bottom-section">
                    <Col xs={12} className="text-center main-icon">
                        <Link to="/bookcase">
                            <Book size={28} />
                            <p>{t('書櫃')}</p>
                        </Link>
                    </Col>
                    <Col xs={3} className="icon-col">
                        <Link to="/">
                            <HouseDoor size={32} />
                            <div className="icon-text">{t('首頁')}</div>
                        </Link>
                    </Col>
                    <Col xs={3} className="icon-col">
                        <Link 
                            to={"/category"}
                            state={{ from: 'homepage' }}
                        >
                            <Grid size={32} />
                            <div className="icon-text">{t('分類')}</div>
                        </Link>
                    </Col>
                    
                    <Col xs={3} className="icon-col">
                        <Link to="/nftMarket">
                            <Cart size={32} />
                            <div className="icon-text">{t('NFT市場')}</div>
                        </Link>
                    </Col>
                    <Col xs={3} className="icon-col">
                        <Link to="/readerPage">
                            <Person size={32} />
                            <div className="icon-text">{t('個人資訊')}</div>
                        </Link>
                    </Col>
                    
                </Row>
            </Container>
        </>
    );
}

export default BottomNavbar;

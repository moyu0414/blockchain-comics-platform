import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Col, Row } from 'react-bootstrap';
import { HouseDoor, Grid, Cart, Person, Book } from 'react-bootstrap-icons';

function BottomNavbar() {
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
                            <Book size={32} />
                        </Link>
                    </Col>
                    <Col xs={3} className="icon-col">
                        <Link to="/">
                            <HouseDoor size={32} />
                            <div className="icon-text">Home</div>
                        </Link>
                    </Col>
                    <Col xs={3} className="icon-col">
                        <Link 
                            to={"/category"}
                            state={{ from: 'homepage' }}
                        >
                            <Grid size={32} />
                            <div className="icon-text">Category</div>
                        </Link>
                    </Col>
                    
                    <Col xs={3} className="icon-col">
                        <Link to="/nftMarket">
                            <Cart size={32} />
                            <div className="icon-text">Market</div>
                        </Link>
                    </Col>
                    <Col xs={3} className="icon-col">
                        <Link to="/readerPage">
                            <Person size={32} />
                            <div className="icon-text">Profile</div>
                        </Link>
                    </Col>
                    
                </Row>
            </Container>
        </>
    );
}

export default BottomNavbar;

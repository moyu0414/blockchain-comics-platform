import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Card, Col, Row, Button, Figure, Dropdown } from 'react-bootstrap';
import './bootstrap.min.css';
import { Funnel} from 'react-bootstrap-icons';
import axios from 'axios';
import { sortByTimestamp } from '../index';

function SearchPage() {

    const buttonData = [
        '少女', '少女', '少女', '少女',
    ];

    const comic = [
        {
            image: 'https://images.pexels.com/photos/7809122/pexels-photo-7809122.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
            title: '戀愛漫畫',
            content: '這是文案文案文案文案'
        },
        {
            image: 'https://images.pexels.com/photos/7809122/pexels-photo-7809122.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
            title: '熱血漫畫',
            content: '這是文案文案文案文案'
        },
        {
            image: 'https://images.pexels.com/photos/7809122/pexels-photo-7809122.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
            title: '懸疑漫畫',
            content: '這是文案文案文案文案'
        }
    ];

    const pathMap = {
        '動作': '/action',
        '冒險': '/adventure',
        '奇幻': '/fantasy',
        '科幻': '/sci-fi'
    };

    return (
        <>
            <Container className='searchPage pt-5'>
                <h4>搜尋歷史</h4>
                <Row className="pt-2 pb-5 w-100">
                    {buttonData.map((label, idx) => (
                        <Col key={idx} xs={2} sm={2} md={2} lg={1} className="pb-3 btn-section">
                            <Link to={pathMap[label]}>
                                <Button variant="outline-dark" className="custom-button">{label}</Button>
                            </Link>
                        </Col>
                    ))}
                </Row>
                <h4>常見分類</h4>
                <Row xs={1} md={2} className="g-4 pb-5">
                    {comic.map((data, idx) => (
                        <Col key={idx} xs={12} md={12} className="pt-3">
                            <Link to={`/comicDetail/${data.comicID}`}>
                                <Card>
                                    <div className="position-relative">
                                        <Card.Img variant="top" src={data.image} />
                                        <div className="category-title">{data.title}</div>
                                        <div className="category-content">{data.content}</div>
                                    </div>
                                </Card>
                            </Link>
                        </Col>
                    ))}
                </Row>
            </Container>
        </>
    );
}

export default SearchPage;

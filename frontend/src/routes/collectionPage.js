import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Card, Col, Row } from 'react-bootstrap';
import './bootstrap.min.css';
import { Funnel } from 'react-bootstrap-icons';
import axios from 'axios';

function CollectionPage() {
    const [comic, setComic] = useState([]);
    const [loading, setLoading] = useState(true);
    const [beingComic, setBeingComic] = useState(true);
    const storedArrayJSON = localStorage.getItem('comicDatas');
    const currentAccount = localStorage.getItem("currentAccount");
    let temp = [];

    const initData = async () => {
        try {
            const response = await axios.get('https://web3toonapi.ddns.net/api/comicDetail/isFavorited', {
                params: {
                    currentAccount: currentAccount,
                }
            });
            //console.log(response.data);

            const collectComicSet = new Set(Object.keys(response.data.collectComic));
            try {
                const storedArray = JSON.parse(storedArrayJSON);
                const temp = storedArray
                .filter(item => item.exists === 1 && collectComicSet.has(item.comicHash))
                .map(item => ({
                    comicID: item.comicID,
                    title: item.title,
                    category: item.category,
                    image: `https://web3toonapi.ddns.net/api/comicIMG/${item.filename}`
                }));
                console.log(temp);
                setComic(temp);
                if (temp.length === 0) {
                    setBeingComic(false);
                }
                setLoading(false);
            } catch (error) {
                console.error('Error initializing comic:', error);
            }
        } catch (error) {
            console.error('Error fetching records:', error);
        }
    };

    useEffect(() => {
        initData();
    }, [currentAccount]);


    return (
        <>
            {!loading ? (
                <Container className='creatorPage'>
                    <Row className='pt-5'>
                        <h3 className="fw-bold">已收藏漫畫</h3>
                    </Row>
                    {!beingComic &&  
                        <Row className='pt-5 justify-content-center'>
                            <h1 className="fw-bold text-center">目前尚未收藏漫畫!</h1>
                        </Row>
                    }
                    <Row xs={1} md={2} className="g-4 pb-5">
                        {comic.map((data, idx) => (
                            <Col key={idx} xs={4} md={3} className="pt-3">
                                <Link to={`/comicDetail/${data.comicID}`}>
                                    <Card>
                                        <div className="position-relative">
                                            <Card.Img variant="top" src={data.image} />
                                            <div className="category-overlay">{data.category}</div>
                                        </div>
                                        <Card.Body>
                                            <Card.Title className='text-center'>{data.title}</Card.Title>
                                        </Card.Body>
                                    </Card>
                                </Link>
                            </Col>
                        ))}
                    </Row>
                </Container>
            ) : (
                <div className="loading-container">
                <div>頁面加載中，請稍後...</div>
                </div>
            )}
        </>
    );
}

export default CollectionPage;

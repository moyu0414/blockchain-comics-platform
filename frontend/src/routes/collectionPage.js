import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Card, Col, Row } from 'react-bootstrap';
import './bootstrap.min.css';
import { Funnel } from 'react-bootstrap-icons';
import axios from 'axios';

function CollectionPage() {
    const [comic, setComic] = useState([]);
    const storedArrayJSON = localStorage.getItem('comicDatas');
    const currentAccount = localStorage.getItem("currentAccount");
    let temp = [];

    const initData = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/comicDetail/isFavorited', {
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
                    image: `http://localhost:5000/api/comicIMG/${item.filename}`
                }));
                console.log(temp);
                setComic(temp);
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
            <Container className='creatorPage'>
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
        </>
    );
}

export default CollectionPage;

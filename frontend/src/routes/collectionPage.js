import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Card, Col, Row } from 'react-bootstrap';
import './bootstrap.min.css';
import { Funnel } from 'react-bootstrap-icons';
import axios from 'axios';

function CollectionPage() {
    const [comic, setComic] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('已經發布');
    const storedArrayJSON = localStorage.getItem('comicDatas');
    const currentAccount = localStorage.getItem("currentAccount");
    let temp = [];

    const initData = async () => {
        try {
            const storedArray = JSON.parse(storedArrayJSON);
            for (let i = 0; i < storedArray.length; i++) {
                if (storedArray[i].exists === 1) {
                    const filename = storedArray[i].filename;
                    const image = `http://localhost:5000/api/comicIMG/${filename}`;
                    if (storedArray[i].author == currentAccount) {
                        temp.push({
                            comicHash: storedArray[i].comicHash,
                            comicID: storedArray[i].comicID,
                            title: storedArray[i].title,
                            category: storedArray[i].category,
                            image: image
                        });
                    }
                }
            }
            console.log(temp);
            setComic(temp);

        } catch (error) {
            console.error('Error initializing contract:', error);
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

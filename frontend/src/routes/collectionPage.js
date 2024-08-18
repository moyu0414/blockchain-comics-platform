import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Card, Col, Row } from 'react-bootstrap';
import './bootstrap.min.css';
import { Funnel } from 'react-bootstrap-icons';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import axios from 'axios';
const website = process.env.REACT_APP_Website;
const API_KEY = process.env.REACT_APP_API_KEY;

function CollectionPage() {
    const [comic, setComic] = useState([]);
    const [loading, setLoading] = useState(true);
    const [beingComic, setBeingComic] = useState(true);
    const { t } = useTranslation();
    const storedArrayJSON = localStorage.getItem('comicDatas');
    const currentAccount = localStorage.getItem("currentAccount");
    const headers = {'api-key': API_KEY};
    let temp = [];

    const initData = async () => {
        try {
            const response = await axios.get(`${website}/api/comicDetail/isFavorited`, {
                headers: headers,
                params: {
                    currentAccount: currentAccount,
                }
            });
            const collectComicSet = new Set(Object.keys(response.data.collectComic));
            try {
                const storedArray = JSON.parse(storedArrayJSON);
                const temp = storedArray
                    .filter(item => item.is_exist === 1 && collectComicSet.has(item.comic_id))
                    .map(async item => {
                        try {
                            const imageResponse = await axios.get(`${website}/api/comicIMG/${item.filename}`, { responseType: 'blob', headers });
                            const imageUrl = URL.createObjectURL(imageResponse.data);
                            return {
                                comicID: item.comicID,
                                title: item.title,
                                category: item.category,
                                image: imageUrl
                            };
                        } catch (error) {
                            console.error(`Error fetching image for ${item.title}: ${error.message}`);
                        }
                    });
                Promise.all(temp)
                    .then(results => {
                        const filteredResults = results.filter(result => result !== null);
                        console.log(filteredResults);
                        setComic(filteredResults);
                        if (filteredResults.length === 0) {
                            setBeingComic(false);
                        }
                        setLoading(false);
                    })
                    .catch(error => {
                        console.error(`Error processing stored data: ${error.message}`);
                    });
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
                        <h3 className="fw-bold">{t('已收藏漫畫')}</h3>
                    </Row>
                    {!beingComic &&  
                        <Row className='pt-5 justify-content-center'>
                            <h1 className="fw-bold text-center">{t('目前尚未收藏漫畫')}</h1>
                        </Row>
                    }
                    <Row xs={1} md={2} className="g-4 pb-5">
                        {comic.map((data, idx) => (
                            <Col key={idx} xs={4} md={3} className="pt-3">
                                <Link to={`/comicDetail/${data.comicID}`}>
                                    <Card>
                                        <div className="position-relative">
                                            <Card.Img variant="top" src={data.image} />
                                            <div className="category-overlay">{t(data.category)}</div>
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
                <div>{t('頁面加載中')}</div>
                </div>
            )}
        </>
    );
}

export default CollectionPage;

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Carousel, Card, Col, Row, Button, Modal, Form } from 'react-bootstrap';
import './bootstrap.min.css';
import { HeartFill, CartFill } from 'react-bootstrap-icons';
import { message } from 'antd';
import { getImageSrc } from '../index';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import axios from 'axios';
const website = process.env.REACT_APP_Website;
const API_KEY = process.env.REACT_APP_API_KEY;

const HomePage = () => {
    const [current, setCurrent] = useState([]);
    const [promoPosition, setPromoPosition] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const { t } = useTranslation();
    const language = localStorage.getItem('language') || i18n.language;
    const isAdult = sessionStorage.getItem('isAdult');
    const headers = {'api-key': API_KEY};
    
    const initData = async () => {
        try {
            const storedArrayJSON = sessionStorage.getItem('comicDatas');
            const storedArray = JSON.parse(storedArrayJSON);
            if (!storedArray) {
                setTimeout(initData, 1000);
                return;
            }
            const response = await axios.get(`${website}/api/homepage/updateStats`, { headers });
            let comics = response.data;
            const totalCountMap = comics.reduce((map, comic) => {
                map[comic.comic_id] = {
                    totHearts: comic.totHearts, // 收藏数
                    totBuy: comic.totBuy // 购买数
                };
                return map;
            }, {});
            const updatedFetchedData = storedArray.map(data => ({
                ...data,
                ...totalCountMap[data.comic_id],
                total: (totalCountMap[data.comic_id]?.totHearts || 0) + (totalCountMap[data.comic_id]?.totBuy || 0)
            }));
            const filteredData = updatedFetchedData.filter(data => data.is_exist === 0);

            const categoryCounts = {};
            filteredData.forEach(data => {
                categoryCounts[data.category] = (categoryCounts[data.category] || 0) + 1;
            });
            const promoCategories = Object.keys(categoryCounts)
                .sort((a, b) => categoryCounts[b] - categoryCounts[a])
                .slice(0, 4); 
            setPromoPosition(promoCategories);
            const fetchComicData = async (comic) => {
                if (promoCategories.includes(comic.category)) {
                    try {
                        const imageResponse = await axios.get(`${website}/api/comicIMG/${comic.comic_id}`, { responseType: 'blob', headers });
                        comic.image = URL.createObjectURL(imageResponse.data); // Set the comic image URL
            
                        if (comic.protoFilename === 1) {
                            const protoFilenameResponse = await axios.get(`${website}/api/coverFile/${comic.comic_id}`, { responseType: 'blob', headers });
                            comic.protoFilename = URL.createObjectURL(protoFilenameResponse.data); // Set the proto image URL
                        }
                    } catch (error) {
                        console.error('Error fetching comic image path:', error);
                    }
                }
            };
            await Promise.all(filteredData.map(fetchComicData));
            filteredData.sort((a, b) => b.total - a.total);
            //console.log(filteredData);
            setCurrent(filteredData);
            setLoading(false);
        } catch (error) {
            console.error('Error initializing contract:', error);
        }
    };

    useEffect(() => {
        if (isAdult === null) {
            setShowModal(true); // 如果是第一次訪問，顯示模態框
        } else {
            setTimeout(initData, 1000);
        }
    }, []);

    const buttonData = [
        '戀愛', '懸疑', '恐怖', '冒險',
        '古風', '玄幻', '武俠', '搞笑',
    ];

    const handleCategoryClick = (category) => {
        localStorage.setItem('currentCategory', category);
    };

    const TermsModal = ({ onAccept }) => {
        const [checked, setChecked] = useState(false);
        const handleAccept = () => {
            if (checked) {
                sessionStorage.setItem('isAdult', true);  // 網頁第一次開啟時，初始化
                setShowModal(false);
                window.location.reload();
            } else {
                message.info(t('請先勾選上述同意方框！'));
            }
        };
        const handleReject = () => {
            if (checked) {
                sessionStorage.setItem('isAdult', false);  // 網頁第一次開啟時，初始化
                setShowModal(false);
                window.location.reload();
            } else {
                message.info(t('請先勾選上述同意方框！'));
            }
        };
        return (
            <Modal show={showModal} onHide={handleReject} centered dialogClassName="verify-custom-modal">
                <Modal.Header>
                    <Modal.Title>
                        <b>web3toon</b> {t('年齡驗證聲明')}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>{t('本網站包含限制級漫畫，涵蓋性、暴力、藥物使用、粗俗語言以及社會禁忌等內容。在使用本平台之前，請您先確認您的年齡是否滿18歲。')}</p>
                    <p>{t('我們將根據您的選擇決定後續內容的顯示。')}</p>
                    <p>{t('您在使用本平台的過程中，承認並同意對於訪問限制級內容的決定及其後果自負責任。')}</p>
                    <p>{t('感謝您的理解與配合。')}</p>
                    <Form.Group className="mb-3">
                        <Form.Check
                            type="checkbox"
                            label={t('我已確實了解上述說明並同意遵守')}
                            checked={checked}
                            onChange={() => setChecked(!checked)}
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleAccept}>
                        {t('已滿18歲(成年)')}
                    </Button>
                    <Button variant="primary" onClick={handleReject}>
                        {t('未滿18歲(未成年)')}
                    </Button>
                </Modal.Footer>
            </Modal>
        );
    };


    return (
        <>
            {showModal && <TermsModal onAccept={() => setShowModal(false)} />}
            {!loading &&
                <Container className='homepage pt-2'>
                    <Carousel>
                        {promoPosition.map(category => {
                            // max(前4個類型)，取第1個輪播
                            const firstItem = current.find(data => data.category === category);
                            if (firstItem) {
                                const imageUrl = firstItem.protoFilename ? firstItem.protoFilename : firstItem.image;
                                return (
                                    <Carousel.Item key={category}>
                                        <Link to={`/comicDetail/${firstItem.comicID}`}>
                                            <div className="carousel-image-container embed-responsive embed-responsive-16by9">
                                                <img
                                                    className="d-block mx-auto img-fluid"
                                                    src={imageUrl}
                                                    alt={`Slide for ${category}`}
                                                />
                                            </div>
                                            <Carousel.Caption className="carousel-caption-custom">
                                                <h3>{firstItem.title}</h3>
                                                <p>{firstItem.description}</p>
                                            </Carousel.Caption>
                                        </Link>
                                    </Carousel.Item>
                                );
                            } else {
                                return null; // 如果沒有找到符合的項目，返回空
                            }
                        })}
                    </Carousel>
        
                    <Row className="pt-5 pb-4 btn-container">
                        {buttonData.map((label, idx) => (
                            <Col key={idx} xs={2} md={2} lg={1} className="pb-1 btn-section">
                                <Button 
                                    variant="outline-dark"
                                    className="custom-button"
                                    onClick={() => handleCategoryClick(t(label))}
                                >
                                    <Link 
                                        to={"/category"}
                                        state={{ from: 'homepage' }}
                                        className="custom-link"
                                    >
                                        {t(label)}
                                    </Link>
                                </Button>
                            </Col>
                        ))}
                    </Row>
                    
                    {promoPosition.map(category => (
                        <div key={category}>
                            <h3 className="fw-bold">{t(category)} {t('漫畫')}</h3>
                            <Carousel interval={null} pause={false} wrap={true} indicators={false} className="comic-carousel">
                                <Carousel.Item>
                                    <div className="carousel-row">
                                        {current.filter(data => data.category === category).map((data, idx) => (
                                            <Col key={idx} xs={6} md={3} className="mx-1">
                                                <Card style={{marginRight: "8%"}} className="ranking-thumbnail-position">
                                                    <Link to={`/comicDetail/${data.comicID}`}>
                                                        <Card.Img variant="top" src={data.image} />
                                                        {data.level === '限制級' && (
                                                            <Card.Img src={getImageSrc(language)} className="level" />
                                                        )}
                                                        <div className="homepage-penName">
                                                            {data.penName}<br />
                                                            <CartFill style={{ marginRight: '5px', marginBottom: "3px" }} />
                                                            {data.totBuy}
                                                            <HeartFill style={{ marginLeft: "5px",marginRight: '5px', marginBottom: "3px" }} />
                                                            {data.totHearts}
                                                        </div>
                                                        <div className="card-overlay">
                                                            <h5 style={{marginTop: "15px"}}>{data.title}</h5>
                                                            <p className="card-overlay-penName">{data.penName}</p>
                                                            <hr />
                                                            <p>{data.description}</p>
                                                        </div>
                                                    </Link>
                                                    <Card.Body>
                                                        <Card.Title className='fw-bold text-center'>{data.title}</Card.Title>
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                        ))}
                                    </div>
                                </Carousel.Item>
                            </Carousel>
                        </div>
                    ))}
                </Container>
            }
            {loading &&  
                <div className="loading-container">
                    <div>{t('頁面加載中')}</div>
                </div>
            }
        </>
    );
}

export default HomePage;

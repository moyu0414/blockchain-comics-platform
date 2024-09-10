import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Carousel, Card, Col, Row, Button, Dropdown } from 'react-bootstrap';
import './bootstrap.min.css';
import { Funnel, HeartFill, CartFill } from 'react-bootstrap-icons';
import { useTranslation } from 'react-i18next';
import { getTranslationKey } from '../index';
import i18n from '../i18n';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
const website = process.env.REACT_APP_Website;
const API_KEY = process.env.REACT_APP_API_KEY;

const CustomToggle = React.forwardRef(({ onClick }, ref) => (
    <div
        ref={ref}
        onClick={(e) => {
            e.preventDefault();
            onClick(e);
        }}
        style={{ cursor: 'pointer' }}
    >
        <Funnel size={36} />
    </div>
));
let updatedFetchedData = [];

function Category() {
    const [currentCategory, setCurrentCategory] = useState('');
    const [current, setCurrent] = useState([]);
    const [promoPosition, setPromoPosition] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [rewind, setRewind] = useState('');
    const [loading, setLoading] = useState(true);
    const location = useLocation();
    const { t } = useTranslation();
    const language = localStorage.getItem('language') || i18n.language;
    const storedArrayJSON = localStorage.getItem('comicDatas');
    const currentAccount = localStorage.getItem("currentAccount");
    let savedCurrentCategory = localStorage.getItem('currentCategory');
    let savedFilter = localStorage.getItem('filter');
    const headers = {'api-key': API_KEY};
    const fetchedData = [];
    
    const initData = async () => {
        try {
            const storedArray = JSON.parse(storedArrayJSON);
            let rewind = getTranslationKey(currentCategory, language);
            setRewind(rewind);
            for (var i = 0; i < storedArray.length; i++) {
                if (storedArray[i].is_exist == 0 && storedArray[i].category == rewind) {
                    const imageResponse = await axios.get(`${website}/api/comicIMG/${storedArray[i].filename}`, { responseType: 'blob', headers });
                    const image = URL.createObjectURL(imageResponse.data);
                    fetchedData.push({ comicHash: storedArray[i].comic_id, comicID: storedArray[i].comicID, title: storedArray[i].title, text: storedArray[i].description, category: storedArray[i].category, image: image, penName: storedArray[i].penName});
                }
            };
            const categoryCounts = {};
            fetchedData.forEach(data => {
                if (categoryCounts[data.category]) {
                    categoryCounts[data.category]++;
                } else {
                    categoryCounts[data.category] = 1;
                }
            });
            const sortPromo = Object.keys(categoryCounts).sort((a, b) => categoryCounts[b] - categoryCounts[a]);
            setPromoPosition(sortPromo);
            try {
                const response = await axios.get(`${website}/api/category/updateStats`, {
                    headers: headers,
                    params: {
                        currentCategory: rewind
                    }
                });
                const comics = response.data;
                const totalCountMap = comics.reduce((map, comic) => {
                    map[comic.comic_id] = {
                        totHearts: comic.totHearts, // 收藏数
                        totBuy: comic.totBuy // 购买数
                    };
                    return map;
                }, {});
                updatedFetchedData = fetchedData.map(data => ({
                    ...data,
                    ...totalCountMap[data.comicHash],
                    total: (totalCountMap[data.comicHash]?.totHearts || 0) + (totalCountMap[data.comicHash]?.totBuy || 0)
                }));
                updatedFetchedData.sort((a, b) => b.total - a.total);
                console.log(updatedFetchedData);
                setCurrent(updatedFetchedData);
                if (updatedFetchedData.length !== 0) {
                    if (savedFilter) {
                        handleCategoryChange(savedFilter);
                    }
                    setLoading(false);
                } else if (location.state && location.state.from === 'homepage') {
                    setLoading(false);
                    location.state = null;
                }
            } catch (error) {
                console.error('Error fetching records:', error);
            }

        } catch (error) {
            console.error('Error initializing contract:', error);
        }
    };

    const buttonData = [
        '戀愛', '懸疑', '恐怖', '冒險',
        '古風', '玄幻', '武俠', '搞笑',
    ];
    
    useEffect(() => {
        if (savedCurrentCategory) {
            setCurrentCategory(savedCurrentCategory);
        };
        initData();
    }, [currentCategory]);

    const handleCategoryClick = (category) => {
        setCurrentCategory(category);
        setSelectedCategory(null);
        localStorage.setItem('currentCategory', category);
        localStorage.setItem('filter', '');
    };

    const handleCategoryChange = (filters) => {
        setSelectedCategory(filters);
        localStorage.setItem('filter', filters);
        // 调用更新函数
        if (filters === '人氣排序') {  // 購買數量
            updatePurchase();
        } else if (filters === '愛心排序') {  // 收藏數量
            updateFavorite();
        } else if (filters === '新上市') {  // 漫畫新發布
            updateComic();
        } else if (filters === '最近更新') {  // 章節更新
            updateChapter();
        }
    };

    const updatePurchase = async () => {
        const sortedCurrent = [...updatedFetchedData].sort((a, b) => b.totBuy - a.totBuy);
        setCurrent(sortedCurrent);
    };

    const updateFavorite = async () => {
        const sortedCurrent = [...updatedFetchedData].sort((a, b) => b.totHearts - a.totHearts);
        setCurrent(sortedCurrent);
    };

    const updateComic = async () => {
        try {
            const response = await axios.get(`${website}/api/category/updateComic`, {
                headers: headers,
                params: {
                    currentCategory: rewind
                }
            });
            let comics = response.data;
            comics.forEach(comic => {
                comic.create_timestamp = Number(comic.create_timestamp);
            });
            const timestampMap = new Map(comics.map(comic => [comic.comicHash, comic.create_timestamp]));
            let sortedComics;
            if (updatedFetchedData.length !== 0) {
                sortedComics = sortComics(updatedFetchedData, timestampMap);
            } else {
                sortedComics = sortComics(current, timestampMap);
            }
            setCurrent(sortedComics);
        } catch (error) {
            console.error('Error fetching records:', error);
        }
    };

    const updateChapter = async () => {
        try {
            const response = await axios.get(`${website}/api/category/updateChapter`, {
                headers: headers,
                params: {
                    currentCategory: rewind
                }
            });
            let chapters = response.data;
            chapters.forEach(chapter => {
                chapter.create_timestamp = Number(chapter.create_timestamp);
            });
            const timestampMap = new Map(chapters.map(chapter => [chapter.comicHash, chapter.create_timestamp]));
            let sortedComics;
            if (updatedFetchedData.length !== 0) {
                sortedComics = sortComics(updatedFetchedData, timestampMap);
            } else {
                sortedComics = sortComics(current, timestampMap);
            }
            setCurrent(sortedComics);
        } catch (error) {
            console.error('Error fetching records:', error);
        }
    };

    const sortComics = (data, timestampMap) => {
        if (!data || !timestampMap) return [];
    
        return [...data].sort((a, b) => {
            const timestampA = timestampMap.get(a.comicHash);
            const timestampB = timestampMap.get(b.comicHash);
            return timestampB - timestampA;
        });
    };

    const truncateText = (text, maxLength) => {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };


    return (
        <>
            {!loading &&
                <Container className='homepage'>
                    <Row className="pt-3 pb-2 btn-container">
                        {buttonData.map((label, idx) => (
                            <Col key={idx} xs={2} md={3} lg={1} className="pb-3 btn-section">
                                <Button variant="outline-dark" className="custom-button" onClick={() => handleCategoryClick(t(label))}>{t(label)}</Button>
                            </Col>
                        ))}
                    </Row>
                    <Row className="align-items-center">
                        <Col>
                            <h3 className="fw-bold">{currentCategory} {t('漫畫')}</h3>
                        </Col>
                        <Col>
                            {selectedCategory && <h3>{t(selectedCategory)}</h3>}
                        </Col>
                        <Col xs="auto">
                            <Dropdown>
                                <Dropdown.Toggle as={CustomToggle} />
                                <Dropdown.Menu>
                                    <Dropdown.Item onClick={() => handleCategoryChange('人氣排序')}>{t('人氣排序')}</Dropdown.Item>
                                    <Dropdown.Item onClick={() => handleCategoryChange('愛心排序')}>{t('愛心排序')}</Dropdown.Item>
                                    <Dropdown.Item onClick={() => handleCategoryChange('新上市')}>{t('新上市')}</Dropdown.Item>
                                    <Dropdown.Item onClick={() => handleCategoryChange('最近更新')}>{t('最近更新')}</Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>
                        </Col>
                    </Row>
                    <Row xs={1} md={2} className="g-4 pb-5">
                        {promoPosition.length === 0 ? (
                            <>
                                <h3 className="fw-bold">{t('目前沒有...類型的漫畫', { category: currentCategory })}</h3>
                                <br />
                            </>
                        ) : (
                            <>
                                <Row xs={1} md={2} className="g-4 pb-5">
                                    {current.map((data, idx) => (
                                        <Col key={idx} xs={6} md={6}>
                                            <Card className="ranking-thumbnail-position">
                                                <Link to={`/comicDetail/${current[idx].comicID}`}>
                                                    <Card.Img variant="top" src={data.image} />
                                                    <div className="homepage-penName">
                                                        {data.penName}<br />
                                                        <CartFill style={{ marginRight: '5px' }} />
                                                        {data.totBuy}
                                                        <HeartFill style={{ marginLeft: "5px",marginRight: '5px' }} />
                                                        {data.totHearts}
                                                    </div>
                                                    <div className="card-overlay">
                                                        <h5 style={{marginTop: "15px"}}>{data.title}</h5>
                                                        <p className="card-overlay-penName">{data.penName}</p>
                                                        <hr />
                                                        <p>{data.text}</p>
                                                    </div>
                                                </Link>
                                                <Card.Body>
                                                    <Card.Title className='fw-bold'>{data.title}</Card.Title>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    ))}
                                </Row>
                            </>
                        )}
                    </Row>
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

export default Category;

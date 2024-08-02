import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Carousel, Card, Col, Row, Button, Dropdown } from 'react-bootstrap';
import './bootstrap.min.css';
import { Funnel, HeartFill, CartFill } from 'react-bootstrap-icons';
import axios from 'axios';

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
    const [loading, setLoading] = useState(true);
    const storedArrayJSON = localStorage.getItem('comicDatas');
    const currentAccount = localStorage.getItem("currentAccount");
    let savedCurrentCategory = localStorage.getItem('currentCategory');
    let savedFilter = localStorage.getItem('filter');
    const fetchedData = [];
    
    const initData = async () => {
        try {
            const storedArray = JSON.parse(storedArrayJSON);
            for (var i = 0; i < storedArray.length; i++) {
                if (storedArray[i].exists == 1 && storedArray[i].category == currentCategory) {
                    const filename = storedArray[i].filename;
                    const image = "http://localhost:5000/api/comicIMG/" + filename;
                    fetchedData.push({ comicHash: storedArray[i].comicHash, comicID: storedArray[i].comicID, title: storedArray[i].title, text: storedArray[i].description, author: storedArray[i].author, category: storedArray[i].category, image: image});
                }
            };
            //setCurrent(fetchedData);
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
            //setPromoPosition(sortPromo.slice(0, 8));
            //console.log(fetchedData);
            try {
                const response = await axios.get('http://localhost:5000/api/category/updateStats', {
                    params: {
                        currentCategory: currentCategory
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
                    totHearts: totalCountMap[data.comicHash]?.totHearts || 0, // 如果没有找到对应的 comic_id，则为 0
                    totBuy: totalCountMap[data.comicHash]?.totBuy || 0 // 如果没有找到对应的 comic_id，则为 0
                }));
                console.log(updatedFetchedData);
                setCurrent(updatedFetchedData);
                if (updatedFetchedData.length !== 0) {
                    if (savedFilter) {
                        handleCategoryChange(savedFilter);
                    }
                    setLoading(false);
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
        } else if (filters === '新發布') {  // 漫畫新發布
            updateComic();
        } else if (filters === '最近更新') {  // 章節更新
            updateChapter();
        }
    };

    const updatePurchase = async () => {
        const sortedCurrent = [...updatedFetchedData].sort((a, b) => b.totBuy - a.totBuy);
        setCurrent(sortedCurrent);
        setSelectedCategory('人氣排序');
    };

    const updateFavorite = async () => {
        const sortedCurrent = [...updatedFetchedData].sort((a, b) => b.totHearts - a.totHearts);
        console.log(sortedCurrent);
        setCurrent(sortedCurrent);
        setSelectedCategory('愛心排序');
    };

    const updateComic = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/category/updateComic', {
                params: {
                    currentCategory: currentCategory
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
            setSelectedCategory('新發布');
        } catch (error) {
            console.error('Error fetching records:', error);
        }
    };

    const updateChapter = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/category/updateChapter', {
                params: {
                    currentCategory: currentCategory
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
            setSelectedCategory('最近更新');
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
                    <Row className="pt-5 pb-5 btn-container">
                        {buttonData.map((label, idx) => (
                            <Col key={idx} xs={2} md={3} lg={1} className="pb-3 btn-section">
                                <Button variant="outline-dark" className="custom-button" onClick={() => handleCategoryClick(label)}>{label}</Button>
                            </Col>
                        ))}
                    </Row>
                    <Row className="align-items-center">
                        <Col>
                            <h3 className="fw-bold">{currentCategory}漫畫</h3>
                        </Col>
                        <Col>
                            {selectedCategory && <h3>{selectedCategory}</h3>}
                        </Col>
                        <Col xs="auto">
                            <Dropdown>
                                <Dropdown.Toggle as={CustomToggle} />
                                <Dropdown.Menu>
                                    <Dropdown.Item onClick={() => handleCategoryChange('人氣排序')}>人氣排序</Dropdown.Item>
                                    <Dropdown.Item onClick={() => handleCategoryChange('愛心排序')}>愛心排序</Dropdown.Item>
                                    <Dropdown.Item onClick={() => handleCategoryChange('新發布')}>新發布</Dropdown.Item>
                                    <Dropdown.Item onClick={() => handleCategoryChange('最近更新')}>最近更新</Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>
                        </Col>
                    </Row>



                    <Row xs={1} md={2} className="g-4 pb-5">
                        {promoPosition.length === 0 ? (
                            <>
                                <h3 className="fw-bold">目前沒有{currentCategory}類型的漫畫。</h3>
                                <br />
                            </>
                        ) : (
                            <>
                                <Row xs={1} md={2} className="g-4 pb-5">
                                    {current.map((data, idx) => (
                                        <Col key={idx} xs={6} md={6} className="pt-3">
                                            <Card>
                                                <Link to={`/comicDetail/${current[idx].comicID}`}>
                                                    <Card.Img variant="top" src={data.image} />
                                                    <div className="category-totcount">
                                                        <CartFill style={{ marginRight: '5px' }} />
                                                        {data.totBuy}<br />
                                                        <HeartFill style={{ marginRight: '5px' }} />
                                                        {data.totHearts}
                                                    </div>
                                                </Link>
                                                <Card.Body>
                                                    <Card.Title className='fw-bold'>{data.title}</Card.Title>
                                                    <Card.Text className='text-secondary'>{data.text}</Card.Text>
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
                    <div>頁面加載中，請稍後...</div>
                </div>
            }
        </>
    );
}

export default Category;

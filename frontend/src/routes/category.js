import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Carousel, Card, Col, Row, Button, Dropdown } from 'react-bootstrap';
import './bootstrap.min.css';
import { Funnel } from 'react-bootstrap-icons';
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

function Category() {
    const [currentCategory, setCurrentCategory] = useState('');
    const [current, setCurrent] = useState([]);
    const [promoPosition, setPromoPosition] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [filter, setFilter] = useState(null);
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
            setCurrent(fetchedData);

            const categoryCounts = {};
            fetchedData.forEach(data => {
                if (categoryCounts[data.category]) {
                    categoryCounts[data.category]++;
                } else {
                    categoryCounts[data.category] = 1;
                }
            });
            const sortPromo = Object.keys(categoryCounts).sort((a, b) => categoryCounts[b] - categoryCounts[a]);
            setPromoPosition(sortPromo.slice(0, 8));
            console.log(fetchedData);
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
        if (savedFilter) {
            setFilter(savedFilter);
        }
        initData();
        console.log('11');
    }, [currentCategory]);

    useEffect(() => {
        console.log('22');
        console.log(filter);
        if (filter) {
            handleCategoryChange(filter);
        }
    }, [filter]);


    const handleCategoryClick = (category) => {
        setCurrentCategory(category);
        setSelectedCategory(null);
        localStorage.setItem('currentCategory', category);
        localStorage.setItem('filter', '');
    };

    const handleCategoryChange = (filters) => {
        setSelectedCategory(filters);
        setFilter(filters);
        console.log(filters);
        localStorage.setItem('filter', filters);
        // 调用更新函数
        if (filters === '新發布') {
            updateComic();
        } else if (filters === '最近更新') {
            updateChapter();
        }
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
            if (fetchedData.length !== 0) {
                sortedComics = sortComics(fetchedData, timestampMap);
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
            if (fetchedData.length !== 0) {
                sortedComics = sortComics(fetchedData, timestampMap);
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


    return (
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
                                <Col key={idx} xs={6} md={3} className="pt-3">
                                    <Card>
                                        <Link to={`/comicDetail/${current[idx].comicID}`}>
                                            <Card.Img variant="top" src={data.image} />
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
    );
}

export default Category;

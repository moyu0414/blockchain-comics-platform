import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Card, Col, Row, Button, Navbar, Form, InputGroup, FormControl } from 'react-bootstrap';
import './bootstrap.min.css';
import { Funnel, ArrowLeft, Search} from 'react-bootstrap-icons';

function SearchPage() {
    const [comic, setComic] = useState([]);
    const [promoPosition, setPromoPosition] = useState([]);
    const [imageWidth, setImageWidth] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearch, setIsSearch] = useState(false);
    const [searchHistory, setSearchHistory] = useState([]);
    const storedArrayJSON = localStorage.getItem('comicDatas');
    const fetchedData = [];

    const initData = async () => {
        try {
            const storedArray = JSON.parse(storedArrayJSON);
            for (var i = 0; i < storedArray.length; i++) {
                if (storedArray[i].exists == 1) {
                    const filename = storedArray[i].filename;
                    const image = "https://web3toonapi.ddns.net/api/comicIMG/" + filename;
                    let protoFilename;
                    if (storedArray[i].protoFilename) {
                        protoFilename = `https://web3toonapi.ddns.net/api/coverFile/${filename}/${storedArray[i].protoFilename}`;
                    } else {
                        protoFilename = image
                    }
                    fetchedData.push({ comicID: storedArray[i].comicID, title: storedArray[i].title, text: storedArray[i].description, author: storedArray[i].author, category: storedArray[i].category, protoFilename: protoFilename});
                }
            };
            console.log(fetchedData);
            setComic(fetchedData);

            if (fetchedData.length > 0) {
                const categoryCounts = fetchedData.reduce((counts, item) => {
                    if (counts[item.category]) {
                        counts[item.category]++;
                    } else {
                        counts[item.category] = 1;
                    }
                    return counts;
                }, {});
                const sortedCategories = Object.keys(categoryCounts).sort((a, b) => categoryCounts[b] - categoryCounts[a]);
                const selectedItems = sortedCategories.slice(0, 4).map(category => {
                    const firstItem = fetchedData.find(item => item.category === category);
                    return firstItem;
                });
                setPromoPosition(selectedItems);
            }
        } catch (error) {
            console.error('Error initializing contract:', error);
        }
    };

    useEffect(() => {
        initData();
        const history = JSON.parse(localStorage.getItem('searchHistory')) || [];
        setSearchHistory(history);
    }, []);

    const handleCategoryClick = (category) => {
        localStorage.setItem('currentCategory', category);
    };

    useEffect(() => {
        // 設置頁面特定的 padding-bottom
        document.body.classList.add('no-padding-bottom');
        return () => {
          // 清除特定頁面的 padding-bottom
        document.body.classList.remove('no-padding-bottom');
        };
    }, []);

    const handleImageLoad = (event) => {
        const width = event.target.clientWidth;
        setImageWidth(width);
    };

    const truncateText = (text) => {
        if (!imageWidth) {
            return text; // 如果图片宽度未知，返回完整文本
        }
        // 根据图片宽度调整文本显示长度
        const adjustedMaxLength = Math.floor(imageWidth / 20); // 假设每个字符大约占用20像素的宽度
        return text.length > adjustedMaxLength ? text.substring(0, adjustedMaxLength) + '...' : text;
    };

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const handleSearchSubmit = (event) => {
        if (event) {
            event.preventDefault();
        }
        if (searchTerm.trim() === '') {
            setSearchResults([]);
            setIsSearch(false);
        } else {
            const results = comic.filter(item =>
                item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.category.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setSearchResults(results);
            const updatedHistorySet = new Set([searchTerm.trim(), ...searchHistory]);
            const updatedHistory = Array.from(updatedHistorySet).slice(0, 5);
            setSearchHistory(updatedHistory);
            localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
            setIsSearch(true);
        }
    };

    const clearSearchHistory = () => {
        setSearchHistory([]);
        localStorage.removeItem('searchHistory');
    };


    return (
        <>
            <div className='no-padding-bottom'>
                <Navbar className="searchPage-custom-navbar" expand="lg">
                    <div className="searchPage-navbar-content">
                        <Navbar.Brand href="/homePage">
                            <div className="searchPage-arrow-icon">
                                <ArrowLeft size={24} />
                            </div>
                        </Navbar.Brand>
                        <Form onSubmit={handleSearchSubmit} className="d-flex ms-3">
                            <InputGroup>
                                <FormControl
                                    placeholder="請輸入漫畫名或作者名"
                                    aria-label="Search"
                                    aria-describedby="basic-addon2"
                                    className="searchPage-search-input"
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                />
                            </InputGroup>
                        </Form>
                    </div>
                </Navbar>
                {isSearch &&
                    <Row xs={1} md={2} className="searchPage">
                        {searchResults.length > 0 && searchResults.map((data, idx) => (
                            <Col key={idx} xs={12} md={12} className="pt-3 pb-1">
                                <Link to={`/comicDetail/${data.comicID}`}>
                                    <Card>
                                        <div className="position-relative">
                                            <Card.Img variant="top" src={data.protoFilename} />
                                            <div className="category-title">{data.title}</div>
                                            <div className="category-content">{truncateText(data.text, 100)}</div>
                                        </div>
                                    </Card>
                                </Link>
                            </Col>
                        ))}
                    </Row>
                }
                {!isSearch &&  
                    <Container className='searchPage pt-3 pb-3'>
                        <h4>搜尋歷史</h4>
                        <Row className="pb-5 w-100">
                            {searchHistory.map((term, index) => (
                                <Col key={index} xs={2} sm={2} md={2} lg={1} className="pb-3 btn-section">
                                    <Button variant="outline-dark" onClick={() => setSearchTerm(term)} className="custom-button">{term}</Button>
                                </Col>
                            ))}
                            <Col xs={2} sm={2} md={2} lg={1} className="pb-3 btn-section">
                                <Button variant="outline-dark" onClick={clearSearchHistory} className="custom-button">清除歷史</Button>
                            </Col>
                        </Row>
                        <h4>常見分類</h4>
                        <Row xs={1} md={2} className="g-4 pb-5">
                            {promoPosition.map((data, idx) => (
                                <Col key={idx} xs={12} md={12} className="pt-3">
                                    <Link to={"/category"}>
                                        <Card>
                                            <div onClick={() => handleCategoryClick(data.category)} className="position-relative">
                                                <Card.Img variant="top" src={data.protoFilename} onLoad={handleImageLoad} />
                                                <div className="category-title">{data.category}漫畫</div>
                                                <div className="category-content">{truncateText(data.text)}</div>
                                            </div>
                                        </Card>
                                    </Link>
                                </Col>
                            ))}
                        </Row>
                    </Container>
                }
            </div>
        </>
    );
}

export default SearchPage;

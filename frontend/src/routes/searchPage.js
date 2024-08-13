import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Container, Card, Col, Row, Button, Navbar, Form, InputGroup, FormControl } from 'react-bootstrap';
import './bootstrap.min.css';
import { Funnel, ArrowLeft, Search } from 'react-bootstrap-icons';
import axios from 'axios';
const website = process.env.REACT_APP_Website;
const API_KEY = process.env.REACT_APP_API_KEY;

function SearchPage() {
    const [comic, setComic] = useState([]);
    const [promoPosition, setPromoPosition] = useState([]);
    const [imageWidth, setImageWidth] = useState(null);
    const [btnWidth, setBtnWidth] = useState(null);
    const btnRef = useRef(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearch, setIsSearch] = useState(false);
    const [searchHistory, setSearchHistory] = useState([]);
    const storedArrayJSON = localStorage.getItem('comicDatas');
    const storedArray = JSON.parse(storedArrayJSON);
    const fetchedData = [];
    const lpInfo = [];
    const headers = {'api-key': API_KEY};

    const initData = async () => {
        try {
            const response = await axios.get(`${website}/api/searchPage/LP`, { headers });
            let lpDatas = response.data;
            if (lpDatas.length > 0) {
                try {
                    const lpInfo = await Promise.all(lpDatas.map(async (data) => {
                        const url = data.protoFilename === 1
                            ? `${website}/api/coverFile/${data.filename}/${data.protoFilename}`
                            : `${website}/api/comicIMG/${data.filename}`;
                        const response = await axios.get(url, { responseType: 'blob', headers });
                        const protoFilename = URL.createObjectURL(response.data);
                        return {
                            ...data,
                            protoFilename: protoFilename
                        };
                    }));
                    setPromoPosition(lpInfo);
                } catch (error) {
                    console.error('Error fetching image:', error);
                }
            }
            if (btnRef.current) {
                setBtnWidth(btnRef.current.offsetWidth);
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
        const adjustedMaxLength = Math.floor(imageWidth / 18); // 假设每个字符大约占用20像素的宽度
        return text.length > adjustedMaxLength ? text.substring(0, adjustedMaxLength) + '...' : text;
    };

    const truncateBtnText = (text) => {
        if (!btnWidth) {
          return text;
        }
        const adjustedMaxLength = Math.floor(btnWidth / 15);
        const isChinese = (char) => /[\u4e00-\u9fa5]/.test(char);
        let length = 0;
        let result = '';
        for (const char of text) {
          length += isChinese(char) ? 2 : 1;
          if (length > adjustedMaxLength) {
            return result + '...';
          }
          result += char;
        }
        return result;
    };

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const handleSearchSubmit = async (event) => {
        if (event) {
            event.preventDefault();
        }
        if (searchTerm.trim() === '') {
            setSearchResults([]);
            setIsSearch(false);
            return;
        }
        try {
            const response = await axios.get(`${website}/api/searchPage/Keyword`, {
                headers: headers,
                params: { term: searchTerm }
            });
            let keywordResults = response.data;
            const fetchedData = await Promise.all(keywordResults.map(async (data) => {
                const url = data.protoFilename === 1
                    ? `${website}/api/coverFile/${data.filename}/${data.protoFilename}`
                    : `${website}/api/comicIMG/${data.filename}`;
                const { data: blobData } = await axios.get(url, { responseType: 'blob', headers });
                const protoFilename = URL.createObjectURL(blobData);
                return { ...data, protoFilename };
            }));
            const updatedFetchedData = fetchedData.map(fetchedItem => {
                const match = storedArray.find(storedItem => storedItem.comic_id === fetchedItem.comic_id);
                return { ...fetchedItem, comicID: match ? match.comicID : null };
            });
            setSearchResults(updatedFetchedData);
            //console.log(updatedFetchedData);
            const updatedHistory = Array.from(new Set([searchTerm.trim(), ...searchHistory])).slice(0, 5);
            setSearchHistory(updatedHistory);
            localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
            setIsSearch(true);
        } catch (error) {
            console.error('Error fetching keyword results:', error);
        }
    };
    
    const clearSearch = () => setSearchTerm('');

    const clearSearchHistory = () => {
        setSearchHistory([]);
        localStorage.removeItem('searchHistory');
    };


    return (
        <>
            <div className='no-padding-bottom'>
                <Navbar className="searchPage-custom-navbar" expand="lg">
                    <div className="searchPage-navbar-content">
                        <Link to="/">
                            <div className="searchPage-arrow-icon">
                                <ArrowLeft size={24} />
                            </div>
                        </Link>
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
                        <Search onClick={handleSearchSubmit} className="searchPage-search" />
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
                                <Col key={index} xs={2} sm={2} md={2} lg={1} className="btn-section">
                                    <Button ref={btnRef} variant="outline-dark" onClick={() => setSearchTerm(term)} className="custom-button">{truncateBtnText(term)}</Button>
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

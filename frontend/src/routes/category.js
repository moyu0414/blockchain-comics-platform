import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Container, Carousel, Card, Col, Row, Button, Dropdown } from 'react-bootstrap';
import './bootstrap.min.css';
import { Funnel } from 'react-bootstrap-icons';

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
    const location = useLocation();
    const [currentCategory, setCurrentCategory] = useState('');
    const [current, setCurrent] = useState([]);
    const [promoPosition, setPromoPosition] = useState([]);
    const storedArrayJSON = localStorage.getItem('comicDatas');
    const fetchedData = [];
    
    const initData = async () => {
        try {
            const storedArray = JSON.parse(storedArrayJSON);
            for (var i = 0; i < storedArray.length; i++) {
                if (storedArray[i].exists == 1 && storedArray[i].category == currentCategory) {
                    const filename = storedArray[i].filename;
                    const image = "http://localhost:5000/api/comicIMG/" + filename;
                    fetchedData.push({ comicID: storedArray[i].comicID, title: storedArray[i].title, text: storedArray[i].description, author: storedArray[i].author, category: storedArray[i].category, image: image});
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
            setPromoPosition(sortPromo.slice(0, 8));  // / 推廣位只選取前四個類型來顯示
            console.log(fetchedData);
        } catch (error) {
            console.error('Error initializing contract:', error);
        }
    };

    useEffect(() => {
        initData();
    }, [currentCategory]);

    const buttonData = [
        '戀愛', '懸疑', '恐怖', '冒險',
        '古風', '玄幻', '武俠', '搞笑',
    ];
    
    useEffect(() => {
        if (location.state) {
          console.log("Location state:", location.state);
          setCurrentCategory(location.state.category)
        };
      }, [location]);

    const handleCategoryClick = (category) => {
        setCurrentCategory(category);
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
                <Col xs="auto">
                    <Dropdown>
                        <Dropdown.Toggle as={CustomToggle} />
                        <Dropdown.Menu>
                            <Dropdown.Item href="#">人氣排序</Dropdown.Item>
                            <Dropdown.Item href="#">愛心排序</Dropdown.Item>
                            <Dropdown.Item href="#">新發布</Dropdown.Item>
                            <Dropdown.Item href="#">最近更新</Dropdown.Item>
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

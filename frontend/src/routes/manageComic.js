import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Card, Button, Row,Col } from 'react-bootstrap';
import './bootstrap.min.css';

function ManageComic() {
    const [comic, setComic] = useState([]);
    const [loading, setLoading] = useState(true);
    const storedArrayJSON = localStorage.getItem('comicDatas');
    const currentAccount = localStorage.getItem("currentAccount");
    let temp = [];

    const initData = async () => {
        try {
            const storedArray = JSON.parse(storedArrayJSON); // 假设 storedArrayJSON 是一个 JSON 字符串
            for (let i = 0; i < storedArray.length; i++) {
                if (storedArray[i].exists === 1 && storedArray[i].author == currentAccount) {
                    const image = `http://localhost:5000/api/comicIMG/${storedArray[i].filename}`;
                    temp.push({
                        comicHash: storedArray[i].comicHash,
                        comicID: storedArray[i].comicID,
                        title: storedArray[i].title,
                        image: image
                    });
                }
            }
            setComic(temp);
            console.log(temp);

            setLoading(false);
        } catch (error) {
            console.error('Error initializing contract:', error);
        }
    };

    useEffect(() => {
        initData();
    }, [currentAccount]);

    const buttonData = [
        '新增章節', '編輯漫畫', '編輯章節', '刪除', '詳情'
    ];

    const pathMap = {
        '新增': '',
        '編輯': '',
        '刪除': '',
        '詳情': (comicID) => `/comicDetail/${comicID}`
    };

    
    return (
        <div>
            {!loading &&
                <Container className='manageComic pt-4'>
                    {comic.map((comic, index) => (
                        <Card className={`mt-4`} key={index}>
                            {/* <Card.Img variant="top" src={comic.image}  alt="..." /> */}
                            <div className="image-container">
                                <Card.Img variant="top" src={comic.image} alt="..." />
                            </div>
                            <Card.Body >
                                <div className="text-section">
                                    <Card.Title>{comic.title}</Card.Title>
                                </div>
                                <div className="cta-section">
                                    <Row>
                                        {buttonData.map((label, idx) => (
                                            <Col xs={6} sm={4} md={4} lg={2} key={idx}>
                                                <Link to={typeof pathMap[label] === 'function' ? pathMap[label](comic.comicID) : pathMap[label]}>
                                                    <Button className="cta-button">{label}</Button>
                                                </Link>
                                            </Col>
                                        ))}
                                    </Row>
                                </div>
                            </Card.Body>
                        </Card>
                    ))}
                </Container>
            }
            {loading &&  
                <div className="loading-container">
                    <div>頁面加載中，請稍後...</div>
                </div>
            }
        </div>
    );
}

export default ManageComic;

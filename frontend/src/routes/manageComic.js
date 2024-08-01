import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Card, Button, Row,Col } from 'react-bootstrap';
import { HouseDoor, Grid, Cart, Person, Book } from 'react-bootstrap-icons';
import './bootstrap.min.css';

function ManageComic() {
    const [comic, setComic] = useState([]);
    const [loading, setLoading] = useState(true);
    const [being, setBeing] = useState(true);
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
            if (temp.length === 0) {
                setBeing(false);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error initializing contract:', error);
        }
    };

    useEffect(() => {
        initData();
    }, [currentAccount]);


    const getComicHash = () => {
        if (comic && comic.length > 0) {
            return comic[0].comicHash; // 选择第一个 comicHash
        }
        return null;
    };

    const buttonData = [
        '新增章節','鑄造NFT', '編輯漫畫', '編輯章節', '刪除', '詳情'
    ];

    const pathMap = {
        '新增章節': {
            pathname: '/createWork',
            state: (comicHash) => ({ showChapterForm: true, comicHash }) // 动态设置状态
        },
        '鑄造NFT': {
            pathname: '/mintNFT',
            state: (comicID) => ({ showChapterForm: true, comicID }) // 动态设置状态
        },
        '編輯漫畫': {
            pathname: '/editWork',
            state: (comicID) => ({ showChapterForm: false, comicID }) // 动态设置状态
        },
        '編輯章節': (comicID) => ({ pathname: `/editChapter/${comicID}` }),
        '刪除': (comicID) => ({ pathname: `/deleteChapter/${comicID}` }),
        '詳情': (comicID) => ({ pathname: `/comicDetail/${comicID}` })
    };

    const handleClick = () => {
        window.location.replace("/createWork");
    };

    
    return (
        <div>
            {!loading &&
                <Container className='manageComic pt-4'>
                    {!being &&  
                        <Row className='pt-5 justify-content-center'>
                            <h1 className="fw-bold text-center">目前尚未上傳漫畫!</h1>
                            <h3 className="fw-bold text-center">點擊下方按鈕進行上傳</h3>
                            <Button onClick={handleClick} className="fw-bold text-center">新增漫畫</Button>
                        </Row>
                    }
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
                                                <Link
                                                to={typeof pathMap[label] === 'function'
                                                    ? pathMap[label](comic.comicID) // 处理动态路径
                                                    : pathMap[label].pathname
                                                }
                                                state={label === '新增章節'
                                                    ? pathMap[label].state(comic.comicHash) // 设置状态
                                                    : label === '鑄造NFT'
                                                    ? pathMap[label].state(comic.comicID) // 设置状态
                                                    : label === '編輯漫畫'
                                                    ? pathMap[label].state(comic.comicID) // 设置状态
                                                    : undefined
                                                }
                                                >
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

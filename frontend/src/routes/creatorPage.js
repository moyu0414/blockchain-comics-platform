import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Card, Col, Row, Button, Figure, Dropdown } from 'react-bootstrap';
import './bootstrap.min.css';
import { Funnel} from 'react-bootstrap-icons';
import axios from 'axios';
import { sortByTimestamp } from '../index';

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

function CreatorPage() {
    const [comic, setComic] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('已經發布');
    const storedArrayJSON = localStorage.getItem('comicDatas');
    const currentAccount = localStorage.getItem("currentAccount");
    let temp = [];

    const initData = async () => {
        try {
            const storedArray = JSON.parse(storedArrayJSON);
            for (let i = 0; i < storedArray.length; i++) {
                if (storedArray[i].exists === 1) {
                    const filename = storedArray[i].filename;
                    const image = `https://web3toonapi.ddns.net/api/comicIMG/${filename}`;
                    if (storedArray[i].author == currentAccount) {
                        temp.push({
                            comicHash: storedArray[i].comicHash,
                            comicID: storedArray[i].comicID,
                            title: storedArray[i].title,
                            category: storedArray[i].category,
                            image: image
                        });
                    }
                }
            }
            console.log(temp);
            setComic(temp);

        } catch (error) {
            console.error('Error initializing contract:', error);
        }
    };

    useEffect(() => {
        initData();
    }, [currentAccount]);

    const buttonData = [
        '收益分析', '已發行NFT', '管理漫畫', '新增漫畫',
    ];

    const pathMap = {
        '收益分析': '/analysis',
        '已發行NFT': '/creatorNft',
        '管理漫畫': '/manageComic',
        '新增漫畫': '/createWork'
    };
    
    const comicCategory = () => {
        // 計算每個 category 的漫畫數量
        const categoryCount = comic.reduce((acc, comic) => {
            acc[comic.category] = (acc[comic.category] || 0) + 1;
            return acc;
        }, {});
        // 根據 category 的數量來排序漫畫
        const sortedComics = [...comic].sort((a, b) => {
            const countA = categoryCount[a.category] || 0;
            const countB = categoryCount[b.category] || 0;
            return countB - countA; // 按數量從多到少排序
        });
        setComic(sortedComics);
        console.log(sortedComics);
        setSelectedCategory('漫畫類型');
    };

    const popPurchase = () => {

        setSelectedCategory('人氣購買');
    };

    const updateChapter = async () => {
        try {
            const response = await axios.get('https://web3toonapi.ddns.net/api/creatorPage/updateChapter', {
                params: {
                    currentAccount: currentAccount
                }
            });
            let chapters = response.data;
            //console.log(chapters);
            chapters.forEach(chapter => {
                chapter.create_timestamp = Number(chapter.create_timestamp);
            });
            const timestampMap = new Map(chapters.map(chapter => [chapter.comicHash, chapter.create_timestamp]));
    
            const sortedComics = [...comic].sort((a, b) => {
            const timestampA = timestampMap.get(a.comicHash);
            const timestampB = timestampMap.get(b.comicHash);
            return timestampB - timestampA;
            });
            setComic(sortedComics);
            setSelectedCategory('最近更新');
        } catch (error) {
            console.error('Error fetching records:', error);
        }
    };


    return (
        <>
            <Container className='creatorPage'>
                <Row className="pt-5">
                    <Figure>
                        <Figure.Image
                            className="d-block mx-auto img-fluid rounded-circle"
                            alt="400x400"
                            src="https://via.placeholder.com/200x200?text=Banner Image"
                        />
                    </Figure>
                </Row>
                <h3><center>創作者專區</center></h3>
                <Row className="pt-2 pb-3 btn-container justify-content-center w-100">
                    {buttonData.map((label, idx) => (
                        <Col key={idx} xs={6} sm={6} md={3} lg={1} className="pb-3 btn-section">
                            <Link to={pathMap[label]}>
                                <Button variant="outline-dark" className="custom-button">{label}</Button>
                            </Link>
                        </Col>
                    ))}
                </Row>
                <Row className="align-items-center">
                    <Col>
                        <h3 className="fw-bold">{selectedCategory}</h3>
                    </Col>
                    <Col xs="auto">
                        <Dropdown>
                            <Dropdown.Toggle as={CustomToggle} />
                            <Dropdown.Menu>
                                <Dropdown.Item onClick={comicCategory}>漫畫類型</Dropdown.Item>
                                <Dropdown.Item onClick={popPurchase}>人氣購買</Dropdown.Item>
                                <Dropdown.Item onClick={updateChapter}>最近更新</Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </Col>
                </Row>
                <Row xs={1} md={2} className="g-4 pb-5">
                    {comic.map((data, idx) => (
                        <Col key={idx} xs={4} md={3} className="pt-3">
                            <Link to={`/comicDetail/${data.comicID}`}>
                                <Card>
                                    <div className="position-relative">
                                        <Card.Img variant="top" src={data.image} />
                                        <div className="category-overlay">{data.category}</div>
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
        </>
    );
}

export default CreatorPage;

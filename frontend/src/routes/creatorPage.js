import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Card, Col, Row, Button, Figure, Dropdown } from 'react-bootstrap';
import './bootstrap.min.css';
import { Funnel, CartFill } from 'react-bootstrap-icons';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import axios from 'axios';
import { sortByTimestamp } from '../index';
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

function CreatorPage() {
    const [comic, setComic] = useState([]);
    const { t } = useTranslation();
    const language = localStorage.getItem('language') || i18n.language;
    const [selectedCategory, setSelectedCategory] = useState(t('已經發布'));
    const storedArrayJSON = localStorage.getItem('comicDatas');
    const currentAccount = localStorage.getItem("currentAccount");
    const headers = {'api-key': API_KEY};
    let temp = [];

    const initData = async () => {
        try {
            const storedArray = JSON.parse(storedArrayJSON);
            for (let i = 0; i < storedArray.length; i++) {
                if (storedArray[i].is_exist === 1) {
                    const imageResponse = await axios.get(`${website}/api/comicIMG/${storedArray[i].filename}`, { responseType: 'blob', headers });
                    const image = URL.createObjectURL(imageResponse.data);
                    if (storedArray[i].creator == currentAccount) {
                        temp.push({
                            comicHash: storedArray[i].comic_id,
                            comicID: storedArray[i].comicID,
                            title: storedArray[i].title,
                            category: t(storedArray[i].category),
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
        t('收益分析'), t('已發行NFT'), t('管理漫畫'), t('新增漫畫'),
    ];

    const pathMap = {
        [t('收益分析')]: '/analysis',
        [t('已發行NFT')]: '/creatorNft',
        [t('管理漫畫')]: '/manageComic',
        [t('新增漫畫')]: '/createWork'
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
        setSelectedCategory(t('漫畫類型'));
    };

    const popPurchase = async () => {
        try {
            const response = await axios.get(`${website}/api/creatorPage/popPurchase`, {
                headers: headers,
                params: {
                    currentAccount: currentAccount
                }
            });
            let comics = response.data;
            const totalCountMap = comics.reduce((map, comic) => {
                map[comic.comic_id] = {
                    totBuy: ` / ${comic.totBuy}`
                };
                return map;
            }, {});
            const updatedData = comic.map(data => ({
                ...data,
                ...totalCountMap[data.comicHash],
            }));
            updatedData.sort((a, b) => {
                return b.totBuy.localeCompare(a.totBuy);
            });
            //console.log(updatedData);
            setComic(updatedData);
            setSelectedCategory(t('人氣購買'));
        } catch (error) {
            console.error('Error fetching records:', error);
        }
    };

    const updateChapter = async () => {
        try {
            const response = await axios.get(`${website}/api/creatorPage/updateChapter`, {
                headers: headers,
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
            setSelectedCategory(t('最近更新'));
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
                <h3><center>{t('創作者專區')}</center></h3>
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
                                <Dropdown.Item onClick={comicCategory}>{t('漫畫類型')}</Dropdown.Item>
                                <Dropdown.Item onClick={popPurchase}>{t('人氣購買')}</Dropdown.Item>
                                <Dropdown.Item onClick={updateChapter}>{t('最近更新')}</Dropdown.Item>
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
                                        <div className="category-overlay">{data.category}{data.totBuy}</div>
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

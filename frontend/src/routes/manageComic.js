import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Card, Button, Row,Col } from 'react-bootstrap';
import { SortDown, SortDownAlt } from 'react-bootstrap-icons';
import './bootstrap.min.css';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import axios from 'axios';
const website = process.env.REACT_APP_Website;
const API_KEY = process.env.REACT_APP_API_KEY;

function ManageComic() {
    const [comic, setComic] = useState([]);
    const [isAscending, setIsAscending] = useState(true);
    const [loading, setLoading] = useState(true);
    const [being, setBeing] = useState(true);
    const { t } = useTranslation();
    const storedArrayJSON = localStorage.getItem('comicDatas');
    const currentAccount = localStorage.getItem("currentAccount");
    const headers = {'api-key': API_KEY};
    let temp = [];

    const initData = async () => {
        try {
            const storedArray = JSON.parse(storedArrayJSON); // 假设 storedArrayJSON 是一个 JSON 字符串
            for (let i = 0; i < storedArray.length; i++) {
                if (storedArray[i].is_exist === 0 && storedArray[i].creator == currentAccount) {
                    const protoFilenameResponse = await axios.get(`${website}/api/comicIMG/${storedArray[i].filename}`, { responseType: 'blob', headers });
                    const image = URL.createObjectURL(protoFilenameResponse.data);
                    temp.push({
                        comicHash: storedArray[i].comic_id,
                        comicID: storedArray[i].comicID,
                        title: storedArray[i].title,
                        image: image,
                        date: storedArray[i].date
                    });
                }
            }
            console.log(temp);
            setComic(temp);
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
        t('新增章節'),t('鑄造NFT'), t('編輯漫畫'), t('編輯章節'), t('刪除'), t('詳情')
    ];

    const pathMap = {
        [t('新增章節')]: {
            pathname: '/createWork',
            state: (comicHash) => ({ showChapterForm: true, comicHash }) // 动态设置状态
        },
        [t('鑄造NFT')]: {
            pathname: '/mintNFT',
            state: (comicID) => ({ showChapterForm: true, comicID }) // 动态设置状态
        },
        [t('編輯漫畫')]: {
            pathname: '/editWork',
            state: (comicID) => ({ showChapterForm: false, comicID }) // 动态设置状态
        },
        [t('編輯章節')]: (comicID) => ({ pathname: `/editChapter/${comicID}` }),
        [t('刪除')]: (comicID) => ({ pathname: `/deleteChapter/${comicID}` }),
        [t('詳情')]: (comicID) => ({ pathname: `/comicDetail/${comicID}` })
    };

    const handleSort = () => {
        setIsAscending(prev => !prev);
        if (being) {
            const sortedComic = [...comic].sort((a, b) => {
                const dateA = new Date(a.date).getTime();
                const dateB = new Date(b.date).getTime();
                return isAscending ? dateA - dateB : dateB - dateA;
            });
            setComic(sortedComic);
        }
    };
    

    return (
        <div>
            {!loading &&
                <Container className='manageComic'>
                    <div className='manageComic-title'>
                        <div onClick={handleSort} className="sort-date">
                            {isAscending ? (
                                <SortDownAlt size={36} />
                            ) : (
                                <SortDown size={36} />
                            )}
                        </div>
                        <h2 className='text-center fw-bold' style={{backgroundColor: "green"}}>{t('漫畫管理')}</h2>
                    </div>
                    {!being &&  
                        <Row className='pt-5 justify-content-center'>
                            <h1 className="fw-bold text-center">{t('目前尚未上傳漫畫')}</h1>
                            <h3 className="fw-bold text-center">{t('點擊下方按鈕進行上傳')}</h3>
                            <Link to="/createWork">
                                <center>
                                    <Button variant="outline-dark" className="custom-button">
                                        {t('新增漫畫')}
                                    </Button>
                                </center>
                            </Link>
                        </Row>
                    }
                    {comic.map((comic, index) => (
                        <Card className={`mt-3`} key={index}>
                            {/* <Card.Img variant="top" src={comic.image}  alt="..." /> */}
                            <div className="image-container ranking-thumbnail-position">
                                <Card.Img variant="top" src={comic.image} alt="comic" />
                                <div className="manageComic-overlay">{comic.date}</div>
                            </div>
                            <Card.Body >
                                <div className="text-section">
                                    <Card.Title>{comic.title}</Card.Title>
                                </div>
                                <div>
                                    <Row>
                                        {buttonData.map((label, idx) => (
                                            <Col xs={6} sm={4} md={4} lg={2} key={idx}>
                                                <Link
                                                to={typeof pathMap[label] === 'function'
                                                    ? pathMap[label](comic.comicID) // 处理动态路径
                                                    : pathMap[label].pathname
                                                }
                                                state={label === t('新增章節')
                                                    ? pathMap[label].state(comic.comicHash) // 设置状态
                                                    : label === t('鑄造NFT')
                                                    ? pathMap[label].state(comic.comicID) // 设置状态
                                                    : label === t('編輯漫畫')
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
                    <div>{t('頁面加載中')}</div>
                </div>
            }
        </div>
    );
}

export default ManageComic;

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Card, Button, Row,Col } from 'react-bootstrap';
import './bootstrap.min.css';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import axios from 'axios';
const website = process.env.REACT_APP_Website;
const API_KEY = process.env.REACT_APP_API_KEY;

function MessagePage() {
    const [comic, setComic] = useState([]);
    const [loading, setLoading] = useState(true);
    const [being, setBeing] = useState(true);
    const { t } = useTranslation();
    const storedArrayJSON = localStorage.getItem('comicDatas');
    const storedArray = JSON.parse(storedArrayJSON);
    const currentAccount = localStorage.getItem("currentAccount");
    const headers = {'api-key': API_KEY};
    let readMsg = JSON.parse(localStorage.getItem('readMsg')) || [];
    let temp = [];

    const initData = async () => {
        try {
            const response = await axios.get(`${website}/api/messagePage`, {
                headers: headers,
                params: {
                    currentAccount: currentAccount,
                }
            });
            let data = response.data.collectComic;
            if (response.data.message == '請先收藏漫畫!') {
                setBeing(false);
                setLoading(false);
            } else {
                const fetchImage = async (item) => {
                    try {
                        const response = await axios.get(`${website}/api/comicIMG/${item.filename}`, { responseType: 'blob', headers });
                        item.image = URL.createObjectURL(response.data);
                        const storedItem = storedArray.find(stored => stored.is_exist === 0 && stored.comic_id === item.comicHash);
                        if (storedItem) {
                            item.comicID = storedItem.comicID;
                        }
                    } catch (error) {
                        console.error(`Error fetching image for item with filename ${item.filename}: ${error.message}`);
                    }
                };
                const updateFavorite = async (item) => {
                    try {
                        await axios.put(`${website}/api/update/comicDetail/favorite`, null, {
                            headers: headers,
                            params: {
                                currentAccount: currentAccount,
                                comicHash: item.comicHash,
                                bool: true,
                                data: item.newCreate
                            }
                        });
                    } catch (error) {
                        console.error('Error handleFavoriteClick', error);
                    }
                };
                if (Array.isArray(data)) {
                    await Promise.all(data.map(fetchImage));
                } else if (typeof data === 'object') {
                    await fetchImage(data);
                }
                await Promise.all(data.map(updateFavorite));
                
                const dataComicHashes = new Set(data.map(item => item.comicHash));
                readMsg = readMsg
                    .filter(readMsgItem => dataComicHashes.has(readMsgItem.comicHash))
                    .map(readMsgItem => {
                        const dataItem = data.find(item => item.comicHash === readMsgItem.comicHash);
                        if (dataItem) {
                            readMsgItem.image = dataItem.image;
                        }
                        return readMsgItem;
                    });
                data.forEach(item => {
                    const index = readMsg.findIndex(readMsgItem =>
                        readMsgItem.comicHash === item.comicHash &&
                        readMsgItem.comicID === item.comicID &&
                        readMsgItem.chapterTitle === item.chapterTitle
                    );
                    if (index !== -1) {
                        readMsg.splice(index, 1);
                    }
                    readMsg.unshift(item);
                });
                readMsg = readMsg.filter(readMsgItem => {
                    const dataItem = data.find(item => item.comicHash === readMsgItem.comicHash);
                    return !(dataItem && Number(dataItem.newCreate) < Number(readMsgItem.newCreate));
                });
                sortByTimestamp(readMsg);
                //console.log(readMsg);
                localStorage.setItem('readMsg', JSON.stringify(readMsg));
                setComic(readMsg);
                setLoading(false);
            }
        } catch (error) {
            console.error('Error initializing data:', error);
        }
    };

    useEffect(() => {
        initData();
    }, [currentAccount]);

    function sortByTimestamp(array) {
        return array.sort((a, b) => {
            const timestampA = parseInt(a.newCreate);
            const timestampB = parseInt(b.newCreate);
            return timestampB - timestampA; // 降序排序
        });
    }


    return (
        <div>
            {!loading ? (
                <Container className='messagePage pt-4'>
                    {!being ? (
                        <Row className='pt-5 justify-content-center'>
                            <h1 className="fw-bold text-center">{t('請先收藏漫畫')}</h1>
                        </Row>
                    ) : (
                        <>
                            {comic.length === 0 ? (
                                <Row className='pt-5 justify-content-center'>
                                    <h1 className="fw-bold text-center">{t('目前沒有更新通知')}</h1>
                                </Row>
                            ) : (
                                comic.map((message, index) => (
                                    <Card className="mt-4" key={index} style={{ display: 'flex' }}>
                                        <div style={{ flex: '1' }}>
                                            <Link to={`/comicDetail/${message.comicID}`}>
                                                <Card.Img variant="top" src={message.image} alt={message.comicTitle} style={{ width: '100%', maxWidth: '100%' }} />
                                            </Link>
                                        </div>
                                        <div style={{ flex: '2', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                            <Card.Body className="text-section text-left">
                                                <Card.Title>{t('漫畫')}：{message.comicTitle}</Card.Title>
                                                <Card.Title>{t('章節更新至')}：{message.chapterTitle}</Card.Title>
                                            </Card.Body>
                                        </div>
                                    </Card>
                                ))
                            )}
                        </>
                    )}
                </Container>
            ) : (
                <div className="loading-container">
                    <div>{t('頁面加載中')}</div>
                </div>
            )}
        </div>
    );
}

export default MessagePage;

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Card, Button, Row,Col } from 'react-bootstrap';
import './bootstrap.min.css';
const website = process.env.REACT_APP_Website;

function MessagePage() {
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
                    const image = `${website}/api/comicIMG/${storedArray[i].filename}`;
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

    const message =[
        {
            image: 'https://images.pexels.com/photos/7809122/pexels-photo-7809122.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
            title: '更新通知！',
            content: '您收藏的漫畫已更新，快來看看吧！'
        },
        {
            image: 'https://images.pexels.com/photos/7809122/pexels-photo-7809122.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
            title: '更新通知！',
            content: '您收藏的漫畫已更新，快來看看吧！您收藏的漫畫已更新，快來看看吧！您收藏的漫畫已更新，快來看看吧！您收藏的漫畫已更新，快來看看吧！您收藏的漫畫已更新，快來看看吧！'
        }
    ]

    
    return (
        <div>
            {!loading &&
                <Container className='messagePage pt-4'>
                    {message.map((message, index) => (
                        <Card className={`mt-4`} key={index}>
                            {/* <Card.Img variant="top" src={comic.image}  alt="..." /> */}
                            <div className="image-container">
                                <Card.Img variant="top" src={message.image} alt="..." />
                            </div>
                            <Card.Body >
                                <div className="text-section">
                                    <Card.Title>{message.title}</Card.Title>
                                    <Card.Text>{message.content}</Card.Text>
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

export default MessagePage;

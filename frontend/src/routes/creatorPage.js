import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Card, Col, Row, Button, Figure, Dropdown } from 'react-bootstrap';
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

function CreatorPage() {
    const [comic, setComic] = useState([]);
    const storedArrayJSON = localStorage.getItem('comicDatas');
    const currentAccount = localStorage.getItem("currentAccount");
    let temp = [];

    const initData = async () => {
        try {
            const storedArray = JSON.parse(storedArrayJSON); // 假设 storedArrayJSON 是一个 JSON 字符串
            for (let i = 0; i < storedArray.length; i++) {
                if (storedArray[i].exists === 1) {
                    const filename = storedArray[i].filename;
                    const image = `http://localhost:5000/api/comicIMG/${filename}`;
                    if (storedArray[i].author == currentAccount) {
                        temp.push({
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
    }, []);

    const buttonData = [
        '收益分析', '已發行NFT', '管理漫畫', '新增漫畫',
    ];

    const pathMap = {
        '收益分析': '/analysis',
        '已發行NFT': '/creatorNft',
        '管理漫畫': '/manageComic',
        '新增漫畫': '/createWork'
    };
    

    return (
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
                    <h3 className="fw-bold">已經發布</h3>
                </Col>
                <Col xs="auto">
                    <Dropdown>
                        <Dropdown.Toggle as={CustomToggle} />
                        <Dropdown.Menu>
                            <Dropdown.Item href="#">漫畫類型</Dropdown.Item>
                            <Dropdown.Item href="#">人氣購買</Dropdown.Item>
                            <Dropdown.Item href="#">最近更新</Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                </Col>
            </Row>
            <Row xs={1} md={2} className="g-4 pb-5">
                {comic.map((data, idx) => (
                    <Col key={idx} xs={4} md={3} className="pt-3">
                    <Link to={`/comicDetail/${data.comicID}`}>
                        <Card>
                            <Card.Img variant="top" src={data.image} />
                            <Card.Body>
                                <Card.Title className='text-center'>{data.title}</Card.Title>
                            </Card.Body>
                        </Card>
                    </Link>
                    </Col>
                ))}
            </Row>
        </Container>
    );
}

export default CreatorPage;

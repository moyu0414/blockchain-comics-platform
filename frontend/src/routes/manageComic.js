import React from 'react';
import { Container, Card, Button } from 'react-bootstrap';
import './bootstrap.min.css';

function ManageComic() {
    const current = [
        { title: '漫畫 1', image: 'https://via.placeholder.com/80x100?text=Image'},
        { title: '漫畫 2', image: 'https://via.placeholder.com/80x100?text=Image'}
    ];
    
    return (
        <Container className='manageComic pt-4'>
            {current.map((comic, index) => (
                <Card className={`mt-4`} key={index}>
                    <Card.Img variant="top" src={comic.image}  alt="..." />
                    <Card.Body >
                        <div className="text-section">
                        <Card.Title>{comic.title}</Card.Title>
                        </div>
                        <div className="cta-section">
                            <Button>新增</Button>
                            <Button>編輯</Button>
                            <Button>刪除</Button>
                            <Button>詳情</Button>
                        </div>
                    </Card.Body>
                </Card>
            ))}
        </Container>
    );
}

export default ManageComic;

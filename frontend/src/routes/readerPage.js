import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Col, Row, Button, Figure } from 'react-bootstrap';
import './bootstrap.min.css';
import { Funnel, Book, Heart, FileEarmarkText, Envelope, CardImage, VectorPen } from 'react-bootstrap-icons';
import { initializeWeb3 } from '../index';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';

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


function ReaderPage() {
    const { t } = useTranslation();
    const [isButtonEnabled, setIsButtonEnabled] = useState(false);

    useEffect(() => {
        const checkAccount = async () => {
            const web3 = await initializeWeb3(t);
            if (web3) {
                const accounts = await web3.eth.getAccounts();
                const currentAccount = accounts[0];
                if (currentAccount) {
                    setIsButtonEnabled(true);
                } else {
                    alert(t('請先登入以太坊錢包，才開放讀者專區'));
                }
            }
        };
        checkAccount();
    }, []);

    const buttonData = [
        { label: t('我的書櫃'), icon: <Book /> },
        { label: t('漫畫收藏'), icon: <Heart /> },
        { label: t('我的購買'), icon: <FileEarmarkText /> },
        { label: t('我的訊息'), icon: <Envelope /> },
        { label: t('NFT收藏'), icon: <CardImage /> },
        { label: t('成為作家'), icon: <VectorPen /> }
    ];

    const pathMap = {
        [t('我的書櫃')]: '/bookcase',
        [t('漫畫收藏')]: '/collectionPage',
        [t('我的購買')]: '/purchaseHistory',
        [t('我的訊息')]: '/messagePage',
        [t('NFT收藏')]: '/collectionNft',
        [t('成為作家')]: '/becomeWriter'
    };
    

    return (
        <Container className='readerPage'>
            <Row className="pt-5">
                <Figure>
                    <Figure.Image
                        className="d-block mx-auto img-fluid rounded-circle"
                        alt="400x400"
                        src="https://via.placeholder.com/200x200?text=Banner Image"
                    />
                </Figure>
            </Row>
            <h3><center>{t('讀者專區')}</center></h3>
            <Row className="pt-4 pb-3 btn-container justify-content-center">
                {buttonData.map((item, idx) => (
                    <Col key={idx} xs={6} sm={6} md={3} lg={1} className="pb-3 btn-section">
                        <Link to={isButtonEnabled ? pathMap[item.label] : '#'} className="d-flex justify-content-center">
                            <Button
                                variant={isButtonEnabled ? "outline-dark" : "outline-secondary"} // 设置颜色
                                className="custom-button"
                                disabled={!isButtonEnabled} // 禁用按钮
                            >
                                <div className="icon-label">
                                    {item.icon}
                                    <span>{item.label}</span>
                                </div>
                            </Button>
                        </Link>
                    </Col>
                ))}
            </Row>
        </Container>
    );
}

export default ReaderPage;

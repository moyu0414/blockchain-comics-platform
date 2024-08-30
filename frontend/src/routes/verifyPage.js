import React, { useState, useRef } from 'react';
import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { initializeWeb3 } from '../index';
import comicData from '../contracts/ComicPlatform.json';
import i18n from '../i18n';
import axios from 'axios';
const website = process.env.REACT_APP_Website;
const API_KEY = process.env.REACT_APP_API_KEY;

const VerifyPage = () => {
    const [formData, setFormData] = useState({name: '', penName: '', email: '', account: ''});
    const [account, setAccount] = useState('');
    const inputRefs = useRef([]);
    const { t } = useTranslation();
    const headers = {'api-key': API_KEY};

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const isFormComplete = () => {
        return formData.name && formData.penName && formData.email;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const web3 = await initializeWeb3(t);
        if (!web3) {
            return;
        }
        const web3Instance = new web3.eth.Contract(comicData.abi, comicData.address);
        const accounts = await web3.eth.getAccounts();
        if (accounts[0]) {
            setAccount(accounts[0].toLowerCase());
            try {
                const updatedFormData = { ...formData, account: accounts[0].toLowerCase() };
                console.log(updatedFormData);
                const response = await axios.post(`${website}/api/send-verification-email`, updatedFormData, { headers });
                console.log(response.data);
                if (response.data.state) {
                    alert('驗證碼15分鐘內有效!')
                } else {
                    alert('email發送錯誤，請重新再試!')
                }
            } catch (error) {
                console.error('Mailbox verification error:', error);
            }
        } else {
            alert(t('請先登入以太坊錢包，才開放創作者認證'));
            return;
        }
    };

    const handleInputChange = (e, index) => {
        // 確保每個輸入框的參考數組都有對應的值
        const inputs = inputRefs.current;

        // 移動到下一個輸入框
        if (e.target.value.length === 1 && index < inputs.length - 1) {
        inputs[index + 1].focus();
        }

        // 防止用戶刪除輸入內容時焦點不會回到前一個輸入框
        if (e.target.value.length === 0 && index > 0) {
        inputs[index - 1].focus();
        }
    };

    const handleClick = async () => {
        try {
            console.log(account);
            const verificationCode = inputRefs.current.map(input => input.value).join('');
            const response = await axios.get(`${website}/api/verify-email`, {
                headers: headers,
                params: {
                    token: verificationCode,
                    account: account
                }
            });
            let state = response.data.state;
            console.log(response.data);
            if (state) {
                window.location.replace("/verifySuccess");
            } else {
                alert('驗證失敗，請重新再試！');
            }
        } catch (error) {
            console.error('Verify email error:', error);
        }
    };
    
    
    return (
        <Container className='verifyPage'>
            <Row className="justify-content-center">
                <Col xs={12} md={8}>
                    <Form.Group controlId="formRealName" className="mb-3">
                        <Form.Label>真實姓名</Form.Label>
                        <Form.Control
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="輸入真實姓名"
                        />
                    </Form.Group>

                    <Form.Group controlId="formPenName" className="mb-3">
                        <Form.Label>筆名（30字以內）</Form.Label>
                        <Form.Control
                            type="text"
                            name="penName"
                            value={formData.penName}
                            onChange={handleChange}
                            placeholder="輸入創作者筆名"
                        />
                    </Form.Group>

                    <Form.Group controlId="formEmail" className="mb-3">
                        <Form.Label>電子郵件</Form.Label>
                        <Form.Control
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="輸入電子郵件"
                        />
                    </Form.Group>

                    <Button
                        onClick={handleSubmit}
                        className="mb-5 float-end"
                        variant={isFormComplete() ? 'success' : 'secondary'}
                        disabled={!isFormComplete()}
                    >
                        信箱驗證
                    </Button>

                    <Form.Group controlId="formVerificationCode" className=" mb-3">
                        <Form.Label className="verification">信箱驗證碼</Form.Label>
                        <div className="verification-code-inputs w-100">
                        {[...Array(6)].map((_, index) => (
                            <Form.Control
                            key={index}
                            type="text"
                            maxLength="1"
                            className="verification-code-input"
                            ref={(el) => (inputRefs.current[index] = el)}
                            onChange={(e) => handleInputChange(e, index)}
                        />
                        ))}
                        </div>
                    </Form.Group>

                    <div className="verification-btn-section mt-4 w-100">
                        <Button onClick={handleClick} className="verify-btn">驗證</Button>
                    </div>
                </Col>
            </Row>
        </Container>
    );
};

export default VerifyPage;

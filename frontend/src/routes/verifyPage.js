import React, { useRef } from 'react';
import { Container, Row, Col, Form, Button } from 'react-bootstrap';

const VerifyPage = () => {

    const inputRefs = useRef([]);

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

    return (
        <Container className='verifyPage'>
            <Row className="justify-content-center">
                <Col xs={12} md={8}>
                <Form.Group controlId="formRealName" className="mb-3">
                    <Form.Label>真實名稱</Form.Label>
                    <Form.Control type="text" placeholder="輸入真實名稱" />
                </Form.Group>

                <Form.Group controlId="formEmail" className="mb-3">
                    <Form.Label>信箱</Form.Label>
                    <Form.Control type="email" placeholder="輸入信箱" />
                </Form.Group>

                <Button className="mb-5 float-end mail-btn">信箱驗證</Button>

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
                    <Button className="verify-btn">驗證</Button>
                </div>
                </Col>
            </Row>
        </Container>
    );
};

export default VerifyPage;

import React, { Component, useState, useMemo  } from 'react';
import { Link } from 'react-router-dom';
import { Container, Col, Row, Form, Tabs, Tab } from 'react-bootstrap';
import './bootstrap.min.css';
import { Heart, HeartFill } from 'react-bootstrap-icons';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import axios from 'axios';
import { formatDate, formatTime, sortByDatetime } from '../index.js';
import { Line } from '@ant-design/charts';
const website = process.env.REACT_APP_Website;
const API_KEY = process.env.REACT_APP_API_KEY;

const DataAnalysis = () => {
    const originalData = [
        { year: '1月', value: 3 },
        { year: '2月', value: 4 },
        { year: '3月', value: 3.5 },
        { year: '4月', value: 5 },
        { year: '5月', value: 4.9 },
        { year: '6月', value: 6 },
        { year: '7月', value: 7 },
        { year: '8月', value: 9 },
        { year: '9月', value: 13 },
        { year: '10月', value: 6 },
        { year: '11月', value: 7 },
        { year: '12月', value: 9 }
    ];

    const [filteredData, setFilteredData] = useState(originalData);
    const [selectedAnalysis, setSelectedAnalysis] = useState('年度收益分析');

    const handleAnalysisChange = (event) => {
        setSelectedAnalysis(event.target.value);
        // 根据选择更新数据，这里只是示例，你可以根据需要进行数据处理
        if (event.target.value === '年度收益分析') {
            setFilteredData(originalData);
        } else {
            // 处理“区间分析”的数据
            // 这里只是示例，假设区间分析筛选了特定的数据范围
            setFilteredData(originalData.filter(item => item.year === '6月' || item.year === '7月'));
        }
    };

    // 创建每个 tab 使用的 config 对象
    const config1 = useMemo(() => ({
        data: filteredData,
        xField: 'year',
        yField: 'value',
        point: {
            size: 5,
            shape: 'circle',
            style: {
                fill: 'white',
                stroke: '#2593fc',
                lineWidth: 2,
            },
        },
    }), [filteredData]);

    const config2 = useMemo(() => ({
        data: filteredData,
        xField: 'year',
        yField: 'value',
        point: {
            size: 5,
            shape: 'circle',
            style: {
                fill: 'white',
                stroke: '#2593fc',
                lineWidth: 2,
            },
        },
    }), [filteredData]);

    return (
        <Container className='dataAnalysis pt-4'>
            <Tabs defaultActiveKey="comic" id="data-analysis-tabs" className="mb-3 w-100">
                <Tab eventKey="comic" title="漫畫">
                    <Form.Group controlId="yearFilterTab1" className='pb-3'>
                        <Form.Select onChange={handleAnalysisChange} aria-label="Year filter">
                            <option value="">選擇分析類別</option>
                            <option value="年度收益分析">年度收益分析</option>
                            <option value="區間分析">區間分析</option>
                        </Form.Select>
                    </Form.Group>
                    <Line {...config1} style={{ width: '100%' }} />
                </Tab>
                <Tab eventKey="nft" title="NFT">
                    <Form.Group controlId="yearFilterTab2" className='pb-3'>
                        <Form.Select onChange={handleAnalysisChange} aria-label="Year filter">
                            <option value="">選擇分析類別</option>
                            <option value="年度收益分析">年度收益分析</option>
                            <option value="區間分析">區間分析</option>
                        </Form.Select>
                    </Form.Group>
                    <Line {...config2} style={{ width: '100%' }} />
                </Tab>
            </Tabs>
        </Container>
    );
};

export default DataAnalysis;
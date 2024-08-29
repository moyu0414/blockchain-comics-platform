import React, { Component, useState  } from 'react';
import { Link } from 'react-router-dom';
import { Container, Col, Row, Form } from 'react-bootstrap';
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

        const originalData  = [
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

        const handleYearFilterChange = (event) => {
            const selectedYear = event.target.value;
            if (selectedYear === 'all') {
            setFilteredData(originalData);
            } else {
            setFilteredData(originalData.filter((item) => item.year === selectedYear));
            }
        };


        const config = {
            data: filteredData, // 确保 data 变量正确指向定义的状态
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
          };
        return (
            <>
                <Container className='dataAnalysis pt-4'>
                    <Form.Group controlId="yearFilter" className='pb-3'>
                        <Form.Select onChange={handleYearFilterChange} aria-label="Year filter">
                        <option value="all">全部月份</option>
                        {originalData.map((item) => (
                            <option key={item.year} value={item.year}>
                            {item.year}
                            </option>
                        ))}
                        </Form.Select>
                    </Form.Group>
                    <Line {...config} />
                </Container>
                
            </>
        )
}
export default DataAnalysis;
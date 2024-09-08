import React, { useState, useEffect, useMemo } from 'react';
import { Line, Pie } from 'react-chartjs-2';
import Chart from 'chart.js/auto';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Container, Form, Tabs, Tab, Table } from 'react-bootstrap';
import { DatePicker, Button, List, Card, message, Select, Row, Col } from 'antd';
import dayjs from 'dayjs';
import './bootstrap.min.css';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import axios from 'axios';
import { formatDate } from '../index.js';
ChartJS.register( CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend );
const website = process.env.REACT_APP_Website;
const API_KEY = process.env.REACT_APP_API_KEY;

// 漫畫－銷售額
const initAllComicData = (comicOrigin) => {
  return comicOrigin.reduce((acc, { purchase_date, price, comicTitle }) => {
    const date = new Date(purchase_date);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const quarter = `Q${Math.ceil((date.getMonth() + 1) / 3)}`;
    const income = (parseFloat(price) * 0.9).toFixed(3);
    const updateData = (type, key) => {
      if (!acc[type][key]) {
        acc[type][key] = { date: key, sales: 0, count: 0, title: []};
      }
      const titleEntry = acc[type][key].title.find(t => t.title === comicTitle);
      if (titleEntry) {
        titleEntry.sales = (parseFloat(titleEntry.sales) + parseFloat(income)).toFixed(3);
      } else {
        acc[type][key].title.push({ title: comicTitle, sales: income });
      }
      acc[type][key].sales = (parseFloat(acc[type][key].sales) + parseFloat(income)).toFixed(3);
      acc[type][key].count += 1;
    };
    updateData('year', `${year}`);
    const quarterKey = `${year}-${quarter}`;
    updateData('quarter', quarterKey);
    const monthKey = `${year}-${month}`;
    updateData('month', monthKey);
    const dayKey = `${year}-${month}-${day}`;
    updateData('day', dayKey);
    return acc;
  }, { year: {}, quarter: {}, month: {}, day: {} });
};

const computeSalesData = (salesArray, timePeriod) => {
  if (!salesArray || !salesArray[timePeriod]) {
    return null;
  }
  const periodData = salesArray[timePeriod] || {};
  const dataArray = Object.values(periodData);
  // Determine the date range
  const allDates = Object.keys(periodData);
  const earliestDate = new Date(Math.min(...allDates.map(date => parseDate(date, timePeriod))));
  const latestDate = new Date(Math.max(...allDates.map(date => parseDate(date, timePeriod))));
  const dateRange = generateDateRangeAll(earliestDate, latestDate, timePeriod);
  // Create a map of dates to sales data
  const titleMap = {};
  const salesMap = {};
  const countMap = {};
  dataArray.forEach(item => {
    salesMap[item.date] = parseFloat(item.sales);
    countMap[item.date] = item.count || 0;
    if (!titleMap[item.date]) {
      titleMap[item.date] = {};
    }
    item.title.forEach(t => {
      const title = t.title;
      const sales = parseFloat(t.sales);
      if (!titleMap[item.date][title]) {
        titleMap[item.date][title] = 0;
      }
      titleMap[item.date][title] += sales;
    });
  });
  // Fill in missing dates with zero sales
  const labels = dateRange;
  const salesData = dateRange.map(date => salesMap[date] || 0);
  const countData = dateRange.map(date => countMap[date] || 0);

  // Chart.js 数据配置
  return {
    labels,
    datasets: [
      {
        label: '漫畫銷售額',
        data: salesData,
        fill: false,
        borderColor: '#1890ff',
        backgroundColor: '#1890ff',
        pointStyle: 'diamond',
        pointRadius: 5,
        countData: countData,
        pieData: titleMap
      },
    ],
  };
};

const generateDateRangeAll = (startDate, endDate, step) => {
  const dates = [];
  let currentDate = new Date(startDate);
  const formatDate = (date, step) => {
    const year = date.getFullYear();
    if (step === 'month') {
      return `${year}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
    } else if (step === 'day') {
      return date.toISOString().split('T')[0]; // YYYY-MM-DD
    } else if (step === 'quarter') {
      const quarter = Math.floor(date.getMonth() / 3) + 1; // Determine the quarter (1-4)
      return `${year}-Q${quarter}`; // YYYY-Q1, YYYY-Q2, etc.
    } else if (step === 'year') {
      return year.toString(); // YYYY
    }
    return ''; // Default case
  };
  while (currentDate <= endDate) {
    dates.push(formatDate(currentDate, step));
    // Move to the next date based on the step
    if (step === 'month') {
      currentDate.setMonth(currentDate.getMonth() + 1);
    } else if (step === 'day') {
      currentDate.setDate(currentDate.getDate() + 1);
    } else if (step === 'year') {
      currentDate.setFullYear(currentDate.getFullYear() + 1);
    } else if (step === 'quarter') {
      currentDate.setMonth(currentDate.getMonth() + 3);
    }
  }
  return dates;
};

const transformPieData = (pieData, period) => {
  const dataForYear = pieData[period] || {};
  const labels = Object.keys(dataForYear);
  const data = Object.values(dataForYear);
  return {
    labels,
    datasets: [
      {
        data,
        backgroundColor: ['#8470FF', '#7FFFD4', '#FFD700', '#CDC5BF', '#F0FFFF'], // Customize colors as needed
      },
    ],
  };
};

const initFilterComicData = (comicOrigin) => {
  const processedData = comicOrigin.reduce((acc, { purchase_date, price, comicTitle, category, filename }) => {
    const date = new Date(purchase_date);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const income = (parseFloat(price) * 0.9);
    if (!acc[comicTitle]) {
      acc[comicTitle] = { year: {}, quarter: {}, month: {}, day: {}, category: category, filename: filename };
    }
    const updateData = (type, key) => {
      if (!acc[comicTitle][type][key]) {
        acc[comicTitle][type][key] = { date: key, sales: 0, count: 0 };
      }
      acc[comicTitle][type][key].sales += income;
      acc[comicTitle][type][key].count += 1; // Increment count for each entry
    };
    updateData('year', `${year}`);
    updateData('quarter', `${year}-${month}`);
    updateData('month', `${year}-${month}`);
    updateData('day', `${year}-${month}-${day}`);
    return acc;
  }, {});
  return processedData;
};

const computeComicData = (comics, selectedComic, selectedPeriod) => {
  if (!comics[selectedComic] || !comics[selectedComic][selectedPeriod]) return null;
  const comicData = comics[selectedComic][selectedPeriod];
  const aggregatedData = Object.values(comicData).reduce((acc, { date, sales, count }) => {
    if (!acc[date]) {
      acc[date] = { sales: 0, count: 0 };
    }
    acc[date].sales += parseFloat(sales);
    acc[date].count += count;
    return acc;
  }, {});
  const step = selectedPeriod === 'month' ? 'month' : selectedPeriod === 'day' ? 'day' : 'year';
  const { startDate, endDate, allMonths } = getDateRange(aggregatedData, step);
  const dateRange = generateDateRange(startDate, endDate, step, allMonths);
  dateRange.forEach(date => {
    if (!aggregatedData[date]) {
      aggregatedData[date] = { sales: 0, count: 0 };
    }
  });
  return {
    labels: dateRange,
    datasets: [{
      label: `${selectedComic} - 漫畫銷售額`,
      data: dateRange.map(date => aggregatedData[date].sales.toFixed(3)),
      backgroundColor: '#ff5733',
      borderColor: '#ff5733',
      borderWidth: 1,
      countData: dateRange.map(date => aggregatedData[date].count)
    }],
  };
};

const getDateRange = (data, step) => {
  const allDates = Object.keys(data);
  const dateToNum = (date) => {
    if (step === 'month') return new Date(date + '-01').getTime(); // YYYY-MM-01
    if (step === 'day') return new Date(date).getTime(); // YYYY-MM-DD
    return new Date(date).getTime(); // YYYY
  };
  const earliestDate = new Date(Math.min(...allDates.map(date => dateToNum(date))));
  const latestDate = new Date(Math.max(...allDates.map(date => dateToNum(date))));
  if (step === 'month') {
    const months = [];
    for (let year = earliestDate.getFullYear(); year <= latestDate.getFullYear(); year++) {
      for (let month = 1; month <= 12; month++) {
        months.push(`${year}-${String(month).padStart(2, '0')}`);
      }
    }
    return { startDate: earliestDate, endDate: latestDate, allMonths: months };
  }
  return { startDate: earliestDate, endDate: latestDate };
};

const generateDateRange = (startDate, endDate, step, allMonths = []) => {
  const dates = new Set();
  let currentDate = new Date(startDate);
  if (step === 'month') {
    const monthsSet = new Set(allMonths);
    while (currentDate <= endDate) {
      dates.add(currentDate.toISOString().slice(0, 7)); // YYYY-MM
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    return Array.from(monthsSet);
  }
  if (step === 'day') {
    while (currentDate <= endDate) {
      dates.add(currentDate.toISOString().split('T')[0]); // YYYY-MM-DD
      currentDate.setDate(currentDate.getDate() + 1); // Increment by 1 day
    }
  } else if (step === 'year') {
    while (currentDate <= endDate) {
      dates.add(currentDate.getFullYear().toString()); // YYYY
      currentDate.setFullYear(currentDate.getFullYear() + 1);
    }
  }
  return Array.from(dates);
};

// 日期解析函数
const parseDate = (dateStr, timePeriod) => {
  let date;
  switch (timePeriod) {
    case 'day':
      date = new Date(dateStr);
      break;
    case 'month':
      date = new Date(dateStr + '-01'); // 假设为该月的第一天
      break;
    case 'quarter':
      const [year, quarter] = dateStr.split('-Q');
      const month = (parseInt(quarter, 10) - 1) * 3 + 1; // 计算季度开始的月份
      date = new Date(`${year}-${month.toString().padStart(2, '0')}-01`);
      break;
    case 'year':
      date = new Date(dateStr + '-01-01'); // 假设为该年的第一天
      break;
    default:
      date = new Date(); // 默认当前日期
  }
  return date.getTime(); // 返回时间戳
};




// 漫畫－客戶群
const parseCustomerDate = (dateStr) => new Date(dateStr);

const calculateSales = (data, startDate, endDate) => {
  return data.reduce((summary, { buyer, price, purchase_date, comicTitle }) => {
    const purchaseDate = new Date(purchase_date);
    if (startDate <= purchaseDate && purchaseDate <= endDate) {
      if (!summary[buyer]) {
        summary[buyer] = { total_amount: 0, count: 0, comics: {} };
      }
      const buyerData = summary[buyer];
      // 更新總額和數量
      buyerData.total_amount += parseFloat(price) * 0.9;
      buyerData.count += 1;
      // 初始化漫畫統計數據
      if (!buyerData.comics[comicTitle]) {
        buyerData.comics[comicTitle] = { total_amount: 0, count: 0 };
      }
      // 更新個別漫畫的統計數據
      buyerData.comics[comicTitle].total_amount += parseFloat(price) * 0.9;
      buyerData.comics[comicTitle].count += 1;
    }
    return summary;
  }, {});
};

const calculateTotalSummary = (salesData) => {
  return Object.values(salesData).reduce((totals, periodData) => {
    Object.values(periodData).forEach(({ total_amount, count }) => {
      totals.total_amount += total_amount;
      totals.count += count;
    });
    return totals;
  }, { total_amount: 0, count: 0 });
};





// 測試數據 60 筆
const test_data_1 = [
  {
    "buyer": "0x7e8f9g0h1i2j3k4l5m6n7o8p9q0r1s2t3u4v4w6x",
    "category": "玄幻",
    "chapterTitle": "002-1",
    "comicTitle": "幽靈學院",
    "filename": "/test/comic1.png",
    "price": "0.06",
    "purchase_date": "2023-02-18T11:00:00.000Z"
  }, {
    "buyer": "0x3a4b5c6d7e8f9g0h1i2j3k4l5m6n7o8p9q0r1s2t",
    "category": "搞笑",
    "chapterTitle": "003-1",
    "comicTitle": "笑爆天",
    "filename": "/test/comic2.png",
    "price": "0.17",
    "purchase_date": "2024-06-10T16:00:00.000Z"
  }, {
    "buyer": "0x7e8f9g0h1i2j3k4l5m6n7o8p9q0r1s2t3u4v5w6x",
    "category": "搞笑",
    "chapterTitle": "004-1",
    "comicTitle": "笑爆天",
    "filename": "/test/comic2.png",
    "price": "0.16",
    "purchase_date": "2023-08-25T14:35:00.000Z"
  }, {
    "buyer": "0x7e8f9g0h1i2j3k4l5m6n7o8p9q0r1s2t3u4v5w6x",
    "category": "武俠",
    "chapterTitle": "005-1",
    "comicTitle": "流浪武士",
    "filename": "/test/comic3.png",
    "price": "0.07",
    "purchase_date": "2024-09-01T11:10:00.000Z"
  }, {
    "buyer": "0x7e8f9g0h1i2j3k4l5m6n7o8p9q0r1s2t3u4v5w6x",
    "category": "武俠",
    "chapterTitle": "001-2",
    "comicTitle": "流浪武士",
    "filename": "/test/comic3.png",
    "price": "0.08",
    "purchase_date": "2024-03-18T12:45:00.000Z"
  }, {
    "buyer": "0x7d8e9f0g1h2i3j4k5l6m7n8o9p0q1r2s3t4u5v6w",
    "category": "玄幻",
    "chapterTitle": "007-2",
    "comicTitle": "隱秘之城",
    "filename": "/test/comic4.png",
    "price": "0.08",
    "purchase_date": "2023-06-30T13:00:00.000Z"
  }, {
    "buyer": "0x7e8f9g0h1i2j3k4l5m6n7o8p9q0r1s2t3u4v5w6x",
    "category": "玄幻",
    "chapterTitle": "006-2",
    "comicTitle": "幽靈學院",
    "filename": "/test/comic1.png",
    "price": "0.07",
    "purchase_date": "2023-12-01T12:20:00.000Z"
  }, {
    "buyer": "0x7e8f9g0h1i2j3k4l5m6n7o8p9q0r1s2t3u4v5w6x",
    "category": "玄幻",
    "chapterTitle": "003-1",
    "comicTitle": "隱秘之城",
    "filename": "/test/comic4.png",
    "price": "0.06",
    "purchase_date": "2024-05-15T14:35:00.000Z"
  }, {
    "buyer": "0x7e8f9g0h1i2j3k4l5m6n7o8p9q0r1s2t3u4v5w6x",
    "category": "戀愛",
    "chapterTitle": "002-2",
    "comicTitle": "絕世戀人",
    "filename": "/test/comic5.png",
    "price": "0.06",
    "purchase_date": "2023-04-20T11:00:00.000Z"
  }, {
    "buyer": "0x7e8f9g0h1i2j3k4l5m6n7o8p9q0r1s2t3u4v5w6x",
    "category": "戀愛",
    "chapterTitle": "007-1",
    "comicTitle": "絕世戀人",
    "filename": "/test/comic5.png",
    "price": "0.05",
    "purchase_date": "2023-11-05T10:45:00.000Z"
  }, {
    "buyer": "0x7e8f9g0h1i2j3k4l5m6n7o8p9q0r1s2t3u4v5w6x",
    "category": "戀愛",
    "chapterTitle": "002-1",
    "comicTitle": "絕世戀人",
    "filename": "/test/comic5.png",
    "price": "0.09",
    "purchase_date": "2024-08-15T14:55:00.000Z"
  }, {
    "buyer": "0x8a9b0c1d2e3f4g5h6i7j8k9l0m1n2o3p4q5r6s7t",
    "category": "搞笑",
    "chapterTitle": "001-1",
    "comicTitle": "風起雲湧",
    "filename": "/test/comic6.png",
    "price": "0.07",
    "purchase_date": "2024-01-10T14:25:00.000Z"
  }, {
    "buyer": "0x6b7c8d9e0f1g2h3i4j5k6l7m8n9o0p1q2r3s4t5u",
    "category": "搞笑",
    "chapterTitle": "003-2",
    "comicTitle": "風起雲湧",
    "filename": "/test/comic6.png",
    "price": "0.07",
    "purchase_date": "2023-06-18T15:20:00.000Z"
  }, {
    "buyer": "0x9e0f1g2h3i4j5k6l7m8n9o0p1q2r3s4t5u6v7w8x",
    "category": "搞笑",
    "chapterTitle": "005-1",
    "comicTitle": "風起雲湧",
    "filename": "/test/comic6.png",
    "price": "0.18",
    "purchase_date": "2024-07-20T12:30:00.000Z"
  }, {
    "buyer": "0x9e0f1g2h3i4j5k6l7m8n9o0p1q2r3s4t5u6v7w8x",
    "category": "搞笑",
    "chapterTitle": "004-2",
    "comicTitle": "風起雲湧",
    "filename": "/test/comic6.png",
    "price": "0.14",
    "purchase_date": "2024-08-05T13:50:00.000Z"
  }, {
    "buyer": "0x6b7c8d9e0f1g2h3i4j5k6l7m8n9o0p1q2r3s4t5u",
    "category": "冒險",
    "chapterTitle": "004-2",
    "comicTitle": "異界遊俠",
    "filename": "/test/comic7.png",
    "price": "0.07",
    "purchase_date": "2023-11-15T12:00:00.000Z"
  }, {
    "buyer": "0x7d8e9f0g1h2i3j4k5l6m7n8o9p0q1r2s3t4u5v6w",
    "category": "冒險",
    "chapterTitle": "006-1",
    "comicTitle": "異界遊俠",
    "filename": "/test/comic7.png",
    "price": "0.06",
    "purchase_date": "2023-10-10T10:15:00.000Z"
  }, {
    "buyer": "0x1d2e3f4g5h6i7j8k9l0m1n2o3p4q5r6s7t8u9v0w",
    "category": "冒險",
    "chapterTitle": "002-2",
    "comicTitle": "異界遊俠",
    "filename": "/test/comic7.png",
    "price": "0.08",
    "purchase_date": "2024-07-01T13:00:00.000Z"
  }, {
    "buyer": "0x4c5d6e7f8g9h0i1j2k3l4m5n6o7p8q9r0s1t2u3v",
    "category": "戀愛",
    "chapterTitle": "002-1",
    "comicTitle": "絕世戀人",
    "filename": "/test/comic5.png",
    "price": "0.05",
    "purchase_date": "2024-03-15T14:25:00.000Z"
  }, {
    "buyer": "0x7e8f9g0h1i2j3k4l5m6n7o8p9q0r1s2t3u4v5w6x",
    "category": "武俠",
    "chapterTitle": "006-2",
    "comicTitle": "流浪武士",
    "filename": "/test/comic3.png",
    "price": "0.08",
    "purchase_date": "2023-09-25T16:20:00.000Z"
  }, {
    "buyer": "0x8a9b0c1d2e3f4g5h6i7j8k9l0m1n2o3p4q5r6s7t",
    "category": "搞笑",
    "chapterTitle": "003-1",
    "comicTitle": "風起雲湧",
    "filename": "/test/comic6.png",
    "price": "0.07",
    "purchase_date": "2023-06-12T10:45:00.000Z"
  }, {
    "buyer": "0x6b7c8d9e0f1g2h3i4j5k6l7m8n9o0p1q2r3s4t5u",
    "category": "搞笑",
    "chapterTitle": "003-2",
    "comicTitle": "風起雲湧",
    "filename": "/test/comic6.png",
    "price": "0.09",
    "purchase_date": "2023-05-05T12:00:00.000Z"
  }, {
    "buyer": "0x9e0f1g2h3i4j5k6l7m8n9o0p1q2r3s4t5u6v7w8x",
    "category": "古風",
    "chapterTitle": "001-1",
    "comicTitle": "天啟之門",
    "filename": "/test/comic8.png",
    "price": "0.16",
    "purchase_date": "2024-01-20T14:15:00.000Z"
  }, {
    "buyer": "0x3a4b5c6d7e8f9g0h1i2j3k4l5m6n7o8p9q0r1s2t",
    "category": "古風",
    "chapterTitle": "005-1",
    "comicTitle": "天啟之門",
    "filename": "/test/comic8.png",
    "price": "0.08",
    "purchase_date": "2024-07-30T15:30:00.000Z"
  }, {
    "buyer": "0x6b7c8d9e0f1g2h3i4j5k6l7m8n9o0p1q2r3s4t5u",
    "category": "古風",
    "chapterTitle": "008-1",
    "comicTitle": "天啟之門",
    "filename": "/test/comic8.png",
    "price": "0.09",
    "purchase_date": "2023-05-10T14:55:00.000Z"
  }, {
    "buyer": "0x9e0f1g2h3i4j5k6l7m8n9o0p1q2r3s4t5u6v7w8x",
    "category": "搞笑",
    "chapterTitle": "002-2",
    "comicTitle": "笑爆天",
    "filename": "/test/comic2.png",
    "price": "0.06",
    "purchase_date": "2024-04-25T13:10:00.000Z"
  }, {
    "buyer": "0x6b7c8d9e0f1g2h3i4j5k6l7m8n9o0p1q2r3s4t5u",
    "category": "玄幻",
    "chapterTitle": "003-2",
    "comicTitle": "隱秘之城",
    "filename": "/test/comic4.png",
    "price": "0.07",
    "purchase_date": "2023-08-30T15:45:00.000Z"
  }, {
    "buyer": "0x7f8g9h0i1j2k3l4m5n6o7p8q9r0s1t2u3v4w5x6y",
    "category": "搞笑",
    "chapterTitle": "001-1",
    "comicTitle": "笑爆天",
    "filename": "/test/comic2.png",
    "price": "0.05",
    "purchase_date": "2024-02-20T16:00:00.000Z"
  }, {
    "buyer": "0x1c2d3e4f5g6h7i8j9k0l1m2n3o4p5q6r7s8t9u0v",
    "category": "古風",
    "chapterTitle": "006-2",
    "comicTitle": "天啟之門",
    "filename": "/test/comic8.png",
    "price": "0.08",
    "purchase_date": "2023-12-05T16:20:00.000Z"
  }, {
    "buyer": "0x6b7c8d9e0f1g2h3i4j5k6l7m8n9o0p1q2r3s4t5u",
    "category": "玄幻",
    "chapterTitle": "008-2",
    "comicTitle": "隱秘之城",
    "filename": "/test/comic4.png",
    "price": "0.09",
    "purchase_date": "2023-11-10T13:30:00.000Z"
  }, {
    "buyer": "0x8f9g0h1i2j3k4l5m6n7o8p9q0r1s2t3u4v5w6x7y",
    "category": "古風",
    "chapterTitle": "002-2",
    "comicTitle": "天啟之門",
    "filename": "/test/comic8.png",
    "price": "0.06",
    "purchase_date": "2023-05-22T14:15:00.000Z"
  }, {
    "buyer": "0x9b0c1d2e3f4g5h6i7j8k9l0m1n2o3p4q5r6s7t8u",
    "category": "古風",
    "chapterTitle": "007-1",
    "comicTitle": "天啟之門",
    "filename": "/test/comic8.png",
    "price": "0.09",
    "purchase_date": "2024-09-06T16:00:00.000Z"
  }, {
    "buyer": "0x6b7c8d9e0f1g2h3i4j5k6l7m8n9o0p1q2r3s4t5u",
    "category": "古風",
    "chapterTitle": "003-2",
    "comicTitle": "天啟之門",
    "filename": "/test/comic8.png",
    "price": "0.06",
    "purchase_date": "2024-03-28T15:15:00.000Z"
  }, {
    "buyer": "0x9e0f1g2h3i4j5k6l7m8n9o0p1q2r3s4t5u6v7w8x",
    "category": "戀愛",
    "chapterTitle": "004-2",
    "comicTitle": "絕世戀人",
    "filename": "/test/comic5.png",
    "price": "0.08",
    "purchase_date": "2024-08-20T12:20:00.000Z"
  }, {
    "buyer": "0x9e0f1g2h3i4j5k6l7m8n9o0p1q2r3s4t5u6v7w8x",
    "category": "搞笑",
    "chapterTitle": "003-1",
    "comicTitle": "風起雲湧",
    "filename": "/test/comic6.png",
    "price": "0.06",
    "purchase_date": "2023-07-25T11:00:00.000Z"
  }, {
    "buyer": "0x9e0f1g2h3i4j5k6l7m8n9o0p1q2r3s4t5u6v7w8x",
    "category": "玄幻",
    "chapterTitle": "003-1",
    "comicTitle": "幽靈學院",
    "filename": "/test/comic1.png",
    "price": "0.07",
    "purchase_date": "2024-02-05T14:10:00.000Z"
  }, {
    "buyer": "0x1d2e3f4g5h6i7j8k9l0m1n2o3p4q5r6s7t8u9v0w",
    "category": "玄幻",
    "chapterTitle": "007-2",
    "comicTitle": "幽靈學院",
    "filename": "/test/comic1.png",
    "price": "0.09",
    "purchase_date": "2023-10-15T16:30:00.000Z"
  }, {
    "buyer": "0x9e0f1g2h3i4j5k6l7m8n9o0p1q2r3s4t5u6v7w8x",
    "category": "搞笑",
    "chapterTitle": "004-2",
    "comicTitle": "笑爆天",
    "filename": "/test/comic2.png",
    "price": "0.08",
    "purchase_date": "2023-08-10T14:25:00.000Z"
  }, {
    "buyer": "0x3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v",
    "category": "冒險",
    "chapterTitle": "009-1",
    "comicTitle": "異界遊俠",
    "filename": "/test/comic7.png",
    "price": "0.07",
    "purchase_date": "2024-06-30T15:45:00.000Z"
  }, {
    "buyer": "0x3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v",
    "category": "冒險",
    "chapterTitle": "004-2",
    "comicTitle": "異界遊俠",
    "filename": "/test/comic7.png",
    "price": "0.06",
    "purchase_date": "2024-07-12T16:00:00.000Z"
  }, {
    "buyer": "0x7e8f9g0h1i2j3k4l5m6n7o8p9q0r1s2t3u4v5w6x",
    "category": "搞笑",
    "chapterTitle": "008-1",
    "comicTitle": "笑爆天",
    "filename": "/test/comic2.png",
    "price": "0.08",
    "purchase_date": "2024-09-05T12:30:00.000Z"
  }, {
    "buyer": "0x1d2e3f4g5h6i7j8k9l0m1n2o3p4q5r6s7t8u9v0w",
    "category": "戀愛",
    "chapterTitle": "004-1",
    "comicTitle": "絕世戀人",
    "filename": "/test/comic5.png",
    "price": "0.09",
    "purchase_date": "2023-05-10T13:20:00.000Z"
  }, {
    "buyer": "0x1d2e3f4g5h6i7j8k9l0m1n2o3p4q5r6s7t8u9v0w",
    "category": "戀愛",
    "chapterTitle": "004-2",
    "comicTitle": "絕世戀人",
    "filename": "/test/comic5.png",
    "price": "0.09",
    "purchase_date": "2023-10-25T11:00:00.000Z"
  }, {
    "buyer": "0x3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v",
    "category": "玄幻",
    "chapterTitle": "008-1",
    "comicTitle": "幽靈學院",
    "filename": "/test/comic1.png",
    "price": "0.07",
    "purchase_date": "2024-04-05T08:10:00.000Z"
  }, {
    "buyer": "0x3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v",
    "category": "冒險",
    "chapterTitle": "005-1",
    "comicTitle": "異界遊俠",
    "filename": "/test/comic7.png",
    "price": "0.06",
    "purchase_date": "2024-08-20T14:25:00.000Z"
  }, {
    "buyer": "0x3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v",
    "category": "古風",
    "chapterTitle": "005-1",
    "comicTitle": "天啟之門",
    "filename": "/test/comic8.png",
    "price": "0.07",
    "purchase_date": "2024-07-11T15:30:00.000Z"
  }, {
    "buyer": "0x7d8e9f0g1h2i3j4k5l6m7n8o9p0q1r2s3t4u5v6w",
    "category": "古風",
    "chapterTitle": "006-1",
    "comicTitle": "天啟之門",
    "filename": "/test/comic8.png",
    "price": "0.07",
    "purchase_date": "2023-10-30T13:15:00.000Z"
  }, {
    "buyer": "0x1d2e3f4g5h6i7j8k9l0m1n2o3p4q5r6s7t8u9v0w",
    "category": "古風",
    "chapterTitle": "007-2",
    "comicTitle": "天啟之門",
    "filename": "/test/comic8.png",
    "price": "0.09",
    "purchase_date": "2023-12-20T12:45:00.000Z"
  }, {
    "buyer": "0x3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v",
    "category": "戀愛",
    "chapterTitle": "007-1",
    "comicTitle": "絕世戀人",
    "filename": "/test/comic5.png",
    "price": "0.05",
    "purchase_date": "2024-03-22T16:30:00.000Z"
  }, {
    "buyer": "0x3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v",
    "category": "玄幻",
    "chapterTitle": "007-2",
    "comicTitle": "幽靈學院",
    "filename": "/test/comic1.png",
    "price": "0.09",
    "purchase_date": "2024-04-05T13:10:00.000Z"
  }, {
    "buyer": "0x3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v",
    "category": "搞笑",
    "chapterTitle": "001-1",
    "comicTitle": "風起雲湧",
    "filename": "/test/comic6.png",
    "price": "0.08",
    "purchase_date": "2024-01-15T11:45:00.000Z"
  }, {
    "buyer": "0x1d2e3f4g5h6i7j8k9l0m1n2o3p4q5r6s7t8u9v0w",
    "category": "玄幻",
    "chapterTitle": "009-1",
    "comicTitle": "幽靈學院",
    "filename": "/test/comic1.png",
    "price": "0.07",
    "purchase_date": "2023-07-20T15:00:00.000Z"
  }, {
    "buyer": "0x4c5d6e7f8g9h0i1j2k3l4m5n6o7p8q9r0s1t2u3v",
    "category": "戀愛",
    "chapterTitle": "007-1",
    "comicTitle": "絕世戀人",
    "filename": "/test/comic5.png",
    "price": "0.08",
    "purchase_date": "2023-04-10T13:30:00.000Z"
  }, {
    "buyer": "0x3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v",
    "category": "冒險",
    "chapterTitle": "008-1",
    "comicTitle": "異界遊俠",
    "filename": "/test/comic7.png",
    "price": "0.08",
    "purchase_date": "2024-05-05T14:00:00.000Z"
  }, {
    "buyer": "0x6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y",
    "category": "冒險",
    "chapterTitle": "005-2",
    "comicTitle": "異界遊俠",
    "filename": "/test/comic7.png",
    "price": "0.06",
    "purchase_date": "2024-06-15T13:45:00.000Z"
  }, {
    "buyer": "0x7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z",
    "category": "古風",
    "chapterTitle": "008-1",
    "comicTitle": "天啟之門",
    "filename": "/test/comic8.png",
    "price": "0.09",
    "purchase_date": "2024-03-05T15:20:00.000Z"
  }, {
    "buyer": "0x8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a",
    "category": "戀愛",
    "chapterTitle": "009-2",
    "comicTitle": "絕世戀人",
    "filename": "/test/comic5.png",
    "price": "0.07",
    "purchase_date": "2024-02-15T12:30:00.000Z"
  }, {
    "buyer": "0x9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b",
    "category": "武俠",
    "chapterTitle": "003-2",
    "comicTitle": "流浪武士",
    "filename": "/test/comic3.png",
    "price": "0.08",
    "purchase_date": "2024-07-05T14:25:00.000Z"
  }, {
    "buyer": "0x1d2e3f4g5h6i7j8k9l0m1n2o3p4q5r6s7t8u9v0w",
    "category": "古風",
    "chapterTitle": "007-1",
    "comicTitle": "天啟之門",
    "filename": "/test/comic8.png",
    "price": "0.09",
    "purchase_date": "2023-11-20T16:30:00.000Z"
  }, {
    "buyer": "0x1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d",
    "category": "武俠",
    "chapterTitle": "010-1",
    "comicTitle": "流浪武士",
    "filename": "/test/comic3.png",
    "price": "0.06",
    "purchase_date": "2024-08-25T13:10:00.000Z"
  }  
];
//1.幽靈學院 玄幻 /test/comic1.png
//2.笑爆天 搞笑 /test/comic2.png
//3.流浪武士 武俠 /test/comic3.png
//4.隱秘之城 玄幻 /test/comic4.png
//5.絕世戀人 戀愛 /test/comic5.png
//6.風起雲湧 搞笑 /test/comic6.png
//7.異界遊俠 冒險 /test/comic7.png
//8.天啟之門 古風 /test/comic8.png


const DataAnalysis = () => {
  const [dataByPeriod, setDataByPeriod] = useState({ year: {}, quarter: {}, month: {}, day: {} });
  const [salesData, setSalesData] = useState('');
  const [timePeriod, setTimePeriod] = useState('year');
  const [comics, setComics] = useState([]);
  const [pieData, setPieData] = useState(null);
  const [pieTop5, setPieTop5] = useState(null);
  const [selectedComic, setSelectedComic] = useState('');
  const [chartData, setChartData] = useState({});
  const [detailData, setDetailData] = useState(null);
  const [lowestDetailData, setLowestDetailData] = useState(null);
  const [comicPeriod, setComicPeriod] = useState('year');
  const [x_title, setX_title] = useState({year: '', month: ''});

  const [buyer, setBuyer] = useState({});
  const [buyerPeriod, setBuyerPeriod] = useState('28天');
  const [selectedBuyer, setSelectedBuyer] = useState('');

  const [cimicRank, setCimicRank] = useState('');
  const [dates, setDates] = useState(null);
  const [rankFilterData, setRankFilterData] = useState([]);
  const [rankSort, setRankSort] = useState('sales');

  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  const currentAccount = localStorage.getItem("currentAccount");
  const headers = {'api-key': API_KEY};

  const initData = async () => {
    try {
      const response = await axios.get(`${website}/api/dataAnalysis/records`, {
        headers,
        params: { currentAccount }
      });
      const comicOrigin = response.data;
      //console.log(comicOrigin);
      
      //if (comicOrigin.length === 0) {
      if (test_data_1.length === 0) {
        message.info(t('目前沒有購買紀錄'));
      }; 

      //const processedData = initAllComicData(comicOrigin);
      const processedData = initAllComicData(test_data_1);
      //console.log(processedData);
      setDataByPeriod(processedData);

      
      //const comics = initFilterComicData(comicOrigin);
      const comics = initFilterComicData(test_data_1);
      //console.log(comics);
      setComics(comics);

      //await initBuyerData(comicOrigin);
      await initBuyerData(test_data_1);

      const filtered = {};
      for (const key in comics) {
        if (comics[key].category) {
          filtered[key] = {
            day: comics[key].day,
            category: comics[key].category,
            filename: comics[key].filename
          };
        };
      };
      //console.log(filtered);
      setCimicRank(filtered);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching records:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    initData();
  }, [currentAccount]);

  // 漫畫－銷售額
  useEffect(() => {
    setSalesData(computeSalesData(dataByPeriod, timePeriod));
  }, [dataByPeriod, timePeriod]);

  useEffect(() => {
    if (selectedComic === t('請選擇漫畫') || timePeriod === 'quarter') {
      return;
    }
    const data = computeComicData(comics, selectedComic, timePeriod);
    setChartData(data);
  }, [selectedComic, timePeriod]);

  const handleChartClick = (event, currentPeriod) => {
    const chart = event.chart;
    if (!chart) return;
    const points = chart.getElementsAtEventForMode(event, 'nearest', { intersect: true }, true);
    if (points.length === 0) return;
    const firstPoint = points[0];
    const label = chart.data.labels[firstPoint.index];
    const generateFilteredData = (period, label, dataCalculator, labelGenerator) => {
      const data = dataCalculator(comics, selectedComic, period);
      const allLabels = labelGenerator(label);
      return {
        labels: allLabels,
        datasets: [{
          label: `${selectedComic} - 銷售額`,
          data: allLabels.map(l => {
            const index = data.labels.indexOf(l);
            return index >= 0 ? data.datasets[0].data[index] : 0;
          }),
          backgroundColor: '#ff5733',
          borderColor: '#ff5733',
          borderWidth: 1,
          countData: allLabels.map(l => {
            const index = data.labels.indexOf(l);
            return index >= 0 ? data.datasets[0].countData[index] : 0;
          })
        }]
      };
    };
    if (currentPeriod === 'year') {
      const year = label;
      const filteredMonthData = generateFilteredData(
        'month',
        year,
        computeComicData,
        year => Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`)
      );
      setComicPeriod('month');
      const x_year = filteredMonthData.labels[0].split('-')[0];
      setX_title(prev => ({ ...prev, year: x_year }));
      setDetailData(filteredMonthData);
      setLowestDetailData(null);
    } else if (currentPeriod === 'month') {
      const month = label;
      const filteredDayData = generateFilteredData(
        'day',
        month,
        computeComicData,
        month => Array.from({ length: 31 }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`)
      );
      setComicPeriod('day');
      const x_month = filteredDayData.labels[0].slice(0, 7);
      setX_title(prev => ({ ...prev, month: x_month }));
      setLowestDetailData(filteredDayData);
    }
  };

  const handlePieChartClick = (event) => {
    const chart = event.chart;
    if (!chart) return;
    const points = chart.getElementsAtEventForMode(event, 'nearest', { intersect: true }, true);
    if (points.length > 0) {
      const firstPoint = points[0];
      const label = chart.data.labels[firstPoint.index];
      const timePeriods = {
        year: 'year',
        quarter: 'quarter',
        month: 'month',
        day: 'day'
      };
      const timePeriodKey = timePeriods[timePeriod];
      const timePeriodData = computeSalesData(dataByPeriod, timePeriodKey);
      const pieChartData = transformPieData(timePeriodData.datasets[0].pieData, label);
      const { labels, datasets } = pieChartData;
      const data = datasets[0].data;
      const top5 = labels
        .map((label, index) => ({ label, value: data[index] }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);
      setPieTop5({
        date: label,
        title: top5.map((item, index) => `${index + 1}. ${item.label}：${item.value} ETH`)
      });
      if (pieChartData.labels.length === 0) {
        message.info(t('目前沒有購買紀錄'));
      }
      setPieData(pieChartData);
    }
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const index = context.dataIndex;
            const sales = context.dataset.data[index];
            const count = context.dataset.countData[index];
            return [`${t('銷售額')}：${sales}`, `${t('數量')}：${count}`];
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: '日期',
        },
      },
      y: {
        title: {
          display: true,
          text: '銷售額',
        },
      },
    },
  };

  const pieOptions = {
    responsive: true, // 使图表在不同屏幕尺寸下自适应
    plugins: {
      legend: {
        position: 'top', // 图例位置（'top', 'bottom', 'left', 'right'）
        labels: {
          color: '#333', // 图例文本颜色
          font: {
            size: 14, // 图例文本字体大小
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function (tooltipItem) {
            const label = tooltipItem.label || '';
            const value = tooltipItem.raw.toFixed(3); // 显示小数点后两位
            return `${label}: ${value}`;
          },
        },
        backgroundColor: '#fff', // 工具提示背景颜色
        titleColor: '#000', // 工具提示标题颜色
        bodyColor: '#000', // 工具提示主体颜色
        borderColor: '#ddd', // 工具提示边框颜色
        borderWidth: 1, // 工具提示边框宽度
      },
    },
    maintainAspectRatio: false, // 不保持图表宽高比，使其填满容器
  };

  const filterOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const index = context.dataIndex;
            const sales = context.dataset.data[index];
            const count = context.dataset.countData[index];
            return [`${t('銷售額')}：${sales}`, `${t('數量')}：${count}`];
          },
        },
      },
    },
    scales: {
      y: {
        title: {
          display: true,
          text: '銷售額',
        },
      },
    },
  };

  const renderLineChart = (data, options) => {
    if (data) {
      return (
        <Line
          data={data}
          options={{
            ...options,
            onClick: (e) => handlePieChartClick(e),
          }}
        />
      );
    }
  };

  const renderPieChart = (data, options) => {
    if (data) {
      return (
        <Pie data={data} options={{options}}/>
      );
    }
    <Pie data={pieData} options={pieOptions} />
  };

  const renderChart = (data, options, period) => {
    if (data) {
      return (
        <Line
          data={data}
          options={{
            ...options,
            onClick: (e) => handleChartClick(e, period),
          }}
        />
      );
    }
  };

  const handlePeriodChange = (e) => {
    const period = e.target.value;
    if (period === 'quarter') {
      setChartData({});
    }
    setTimePeriod(period);
    setComicPeriod(period);
    setDetailData(null);
    setLowestDetailData(null);
    setX_title({});
    setPieData(null);
  };

  const handleComicChange = (e) => {
    setSelectedComic(e.target.value);
    setDetailData(null);
    setLowestDetailData(null);
    setX_title({});
  };




// 漫畫－客戶群
const initBuyerData = (data) => {
  const today = new Date();
  const periods = {
    '7天': [new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000), today],
    '28天': [new Date(today.getTime() - 28 * 24 * 60 * 60 * 1000), today],
    '90天': [new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000), today],
    '180天': [new Date(today.getTime() - 180 * 24 * 60 * 60 * 1000), today],
    '2023': [new Date('2023-01-01T00:00:00Z'), new Date('2023-12-31T23:59:59Z')],
    '2024': [new Date('2024-01-01T00:00:00Z'), new Date('2024-12-31T23:59:59Z')],
    '發布至今': [new Date('2023-01-01T00:00:00Z'), today],
  };
  const salesData = {};
  for (const [period, [start, end]] of Object.entries(periods)) {
    salesData[period] = calculateSales(data, start, end);
  }
  setBuyer(salesData);
};

const getSummary = (periodData) => {
  const summary = { total_amount: 0, count: 0, buyerCount: 0 };
  Object.values(periodData || {}).forEach(({ total_amount, count }) => {
    summary.total_amount += total_amount;
    summary.count += count;
  });
  summary.buyerCount = Object.keys(periodData || {}).length;
  return summary;
};

const currentPeriodData = buyer[buyerPeriod] || {};
const summary = getSummary(currentPeriodData);

const sortedBuyers = Object.entries(currentPeriodData).sort(([, a], [, b]) =>
  rankSort === 'sales' ? b.total_amount - a.total_amount : b.count - a.count
);

const sortedBuyerComics = selectedBuyer ? Object.entries(currentPeriodData[selectedBuyer].comics || {})
.sort(([, a], [, b]) => b.total_amount - a.total_amount) : [];

const totalStats = Object.values(currentPeriodData).reduce(
  (acc, { total_amount, count }) => {
    acc.total_amount += total_amount;
    acc.count += count;
    return acc;
  },
  { total_amount: 0, count: 0 }
);

const getComicsForBuyer = (buyerId) => {
  const buyer = sortedBuyers.find(([id]) => id === buyerId);
  return buyer ? Object.entries(buyer[1].comics) : [];
};




  // 漫畫－排行榜
  const filterDataByRange = async () => {
    if (dates && dates[0] && dates[1]) {
      const start = dates[0].startOf('day').toDate();
      const end = dates[1].endOf('day').toDate();
      const aggregatedData = {};
      for (const comic in cimicRank) {
        const days = cimicRank[comic].day;
        const filteredDays = Object.values(days).filter((item) => {
          const itemDate = new Date(item.date);
          return itemDate >= start && itemDate <= end;
        });
        if (filteredDays.length > 0) {
          let totalSales = 0;
          let totalCount = 0;
          filteredDays.forEach(({ sales, count }) => {
            totalSales += sales;
            totalCount += count;
          });
          //const response = await axios.get(`${website}/api/comicIMG/${cimicRank[comic].filename}`, { responseType: 'blob', headers });
          //const image = URL.createObjectURL(response.data);
          aggregatedData[comic] = {
            totalSales: totalSales.toFixed(3),
            totalCount,
            category: cimicRank[comic].category,
            //image: image
            image: cimicRank[comic].filename
          };
        }
      }
      if (Object.keys(aggregatedData).length > 0) {
        console.log(aggregatedData);
        setRankFilterData(aggregatedData);
      } else {
        message.info('沒有符合條件的資料');
        setRankFilterData({});
      }
    } else {
      message.warning('請選擇完整的日期區間');
    }
  };

  useEffect(() => {
    setRankFilterData([]);
  }, [dates]);

  const handleSortChange = (value: string) => {
    setRankSort(value);
  };

  const sortedRank = () => {
    const entries = Object.entries(rankFilterData);
    if (rankSort === 'sales') {
      return entries.sort(([ , a], [ , b]) => b.totalSales - a.totalSales);
    } else if (rankSort === 'count') {
      return entries.sort(([ , a], [ , b]) => b.totalCount - a.totalCount);
    }
    return entries;
  };
  

  return (
    <>
      {!loading &&
        <Container className='dataAnalysis'>
          <div className='dataAnalysis-title'>
            <h2 className='text-center fw-bold' style={{backgroundColor: "green"}}>{t('數據分析')}</h2>
            <Form.Select value={timePeriod} onChange={handlePeriodChange}>
              <option value="year">年</option>
              <option value="quarter">季</option>
              <option value="month">月</option>
              <option value="day">日</option>
            </Form.Select>
          </div>
          <Tabs defaultActiveKey="comic" id="data-analysis-tabs" className="mb-3 w-100">
            <Tab eventKey="comic" title="漫畫">
              <Tabs defaultActiveKey="comicSales" className="mb-3 w-100 custom-tabs">
                <Tab eventKey="comicSales" title="銷售額">
                  <div style={{marginBottom: "50px"}}>
                    <h1>{t('漫畫總銷售額')}</h1>
                    {salesData && salesData.labels.length > 0 ? (
                      <>
                        {renderLineChart(salesData, options)}
                        {pieData && Object.keys(pieData).length > 0 && (
                          <>
                            <center>
                              <h2>{t('漫畫銷售佔比')}</h2>
                              {pieTop5 && pieTop5.title.length !== 0 ? (
                                <>
                                  {renderPieChart(pieData, pieOptions)}
                                  <h3>{pieTop5.date} {t('TOP 5')}</h3>
                                  {pieTop5.title && pieTop5.title.map((item, index) => (
                                    <p key={index}>{item}</p>
                                  ))}
                                </>
                              ) : (
                                <>
                                  <h3>{pieTop5.date} {t('TOP 5')}</h3>
                                  <p>{t('目前沒有購買紀錄')}</p>
                                </>
                              )}
                            </center>
                          </>
                        )}
                      </>
                    ) : (
                      <p>{t('目前沒有購買紀錄')}</p>
                    )}

                    <h3>{t('篩選漫畫')}</h3>
                    <Form.Select value={selectedComic} onChange={handleComicChange}>
                      <option value="">{t('請選擇漫畫')}</option>
                      {Object.keys(comics).map((comic, index) => (
                        <option key={index} value={comic}>{comic}</option>
                      ))}
                    </Form.Select>

                    {chartData && Object.keys(chartData).length > 0 && (
                      <>
                        {renderChart(chartData, options, timePeriod)}
                        {renderChart(detailData, filterOptions, timePeriod === 'year' ? 'month' : comicPeriod)}

                        {timePeriod === 'year' && (comicPeriod === 'month' || comicPeriod === 'day') && (
                          <center><p>{x_title.year}</p></center>
                        )}

                        {renderChart(lowestDetailData, filterOptions, timePeriod === 'month' ? 'day' : comicPeriod)}

                        {(timePeriod === 'year' && comicPeriod === 'day') ? (
                          <center><p>{x_title.month}</p></center>
                        ) : timePeriod === 'month' ? (
                          <center><p>{x_title.month}</p></center>
                        ) : (
                          null
                        )}
                      </>
                    )}
                  </div>
                </Tab>
                
                <Tab eventKey="comicCustomer" title="客户群">
                  <div>
                    <h1>買家銷售總覽</h1>
                    <div>
                      {Object.keys(buyer).map(period => (
                        <button key={period} onClick={() => setBuyerPeriod(period)}>
                          {period}
                        </button>
                      ))}
                    </div>
                    <div>
                      <h5>區間：{buyerPeriod}</h5>
                      <h4>買家數量：{summary.buyerCount}</h4>
                      <h4>總收益： ${summary.total_amount.toFixed(3)}</h4>
                      <h4>總數量：{summary.count}</h4>
                      <Select
                        defaultValue="sales"
                        style={{ width: 200, marginBottom: 16 }}
                        onChange={handleSortChange}
                      >
                        <Select.Option value="sales">銷售額排序</Select.Option>
                        <Select.Option value="count">購買量排序</Select.Option>
                      </Select>
                      <Table>
                        <thead>
                          <tr>
                            <th>買家</th>
                            <th>銷售額</th>
                            <th>總數量</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedBuyers.map(([buyerId, stats]) => (
                            <React.Fragment key={buyerId}>
                              <tr onClick={() => setSelectedBuyer(buyerId === selectedBuyer ? null : buyerId)}>
                                <td>{buyerId}</td>
                                <td>${stats.total_amount.toFixed(3)}</td>
                                <td>{stats.count}</td>
                              </tr>
                              {selectedBuyer === buyerId && (
                                getComicsForBuyer(buyerId).map(([comicTitle, comicStats]) => (
                                  <tr key={comicTitle}>
                                    <td>{comicTitle}</td>
                                    <td>${comicStats.total_amount.toFixed(3)}</td>
                                    <td>{comicStats.count}</td>
                                  </tr>
                                ))
                              )}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  </div>
                </Tab>


                <Tab eventKey="comicRank" title="排行榜">
                  <div>
                    <h2>選擇日期區間</h2>
                    <Row gutter={16}>
                      <Col span={12}>
                        <div style={{ marginBottom: 16 }}>
                          <DatePicker
                            onChange={(value) => setDates([value, dates ? dates[1] : null])}
                            format="YYYY/MM/DD"
                            style={{ width: '100%' }}
                            placeholder="開始日期"
                          />
                        </div>
                      </Col>
                      <Col span={12}>
                        <div style={{ marginBottom: 16 }}>
                          <DatePicker
                            onChange={(value) => setDates([dates ? dates[0] : null, value])}
                            format="YYYY/MM/DD"
                            style={{ width: '100%' }}
                            placeholder="結束日期"
                          />
                        </div>
                      </Col>
                    </Row>
                    <Button
                      type="primary"
                      onClick={filterDataByRange}
                      disabled={!dates || !dates[0] || !dates[1]}
                    >
                      顯示資料
                    </Button>
                    <Select
                      defaultValue="sales"
                      style={{ width: 200, marginBottom: 16 }}
                      onChange={handleSortChange}
                    >
                      <Select.Option value="sales">銷售額排序</Select.Option>
                      <Select.Option value="count">購買量排序</Select.Option>
                    </Select>
                    <div style={{ marginTop: 16 }}>
                      <h3>符合條件的資料：</h3>
                      {Object.keys(rankFilterData).length > 0 ? (
                        <List
                          className="rankingList"
                          bordered
                          dataSource={sortedRank()}
                          renderItem={([comic, { totalSales, totalCount, image, category }]) => (
                            <List.Item className="d-flex align-items-center ranking-list">
                              <div className="ranking-image">
                                <img src={image} alt={comic} className="ranking-thumbnail" />
                              </div>
                              <div className="ranking-card-info ms-3">
                                <div className="ranking-title">{comic}</div>
                                <div className="ranking-title">類型：{category}</div>
                                <div className="ranking-title">銷售額：{totalSales}</div>
                                <div className="ranking-title">購買量：{totalCount}</div>
                              </div>
                            </List.Item>
                          )}
                        />
                      ) : (
                        <p>沒有符合條件的資料</p>
                      )}
                    </div>
                  </div>
                </Tab>
              </Tabs>
            </Tab>
            <Tab eventKey="nft" title="NFT">
              {/* NFT 的相关内容 */}
            </Tab>
          </Tabs>
        </Container>
      }
      {loading &&  
        <div className="loading-container">
            <div>{t('頁面加載中')}</div>
        </div>
      }
    </>
  );
};


export default DataAnalysis;

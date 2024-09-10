import React, { useState, useEffect } from 'react';

const WorkManagement = () => {
  const [works, setWorks] = useState([]);

  useEffect(() => {
    const fetchWorks = async () => {
      const fetchedWorks = await fetchWorksFromBackend();
      setWorks(fetchedWorks);
    };

    fetchWorks();
  }, []);

  const fetchWorksFromBackend = async () => {
    return [
      {
        id: 1,
        title: '作品標題1',
        cover: '封面1.jpg',
        status: '已公開',
        uploadDate: '2024-05-10',
        commentsEnabled: true
      },
      {
        id: 2,
        title: '作品標題2',
        cover: '封面2.jpg',
        status: '未公開',
        uploadDate: '2024-05-11',
        commentsEnabled: false
      },
    ];
  };

  const editWork = (workId) => {
    console.log(`編輯作品 ${workId}`);
  };

  const deleteWork = (workId) => {
    console.log(`刪除作品 ${workId}`);
  };

  return (
    <div className="work-management-page">
      <h1>作品管理</h1>
      <table>
        <thead>
          <tr>
            <th>作品標題</th>
            <th>狀態</th>
            <th>上傳日期</th>
            <th>留言</th>
            <th>管理作品</th>
          </tr>
        </thead>
        <tbody>
          {works.map(work => (
            <tr key={work.id}>
              <td>
                <div className="work-info">
                  <img src={work.cover} alt={work.title} />
                  <div className="work-title">{work.title}</div>
                </div>
              </td>
              <td>{work.status}</td>
              <td>{work.uploadDate}</td>
              <td>{work.commentsEnabled ? '開啟' : '關閉'}</td>
              <td>
                <button className='edit-button' onClick={() => editWork(work.id)}>編輯</button>
                <button className='delete-button' onClick={() => deleteWork(work.id)}>刪除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default WorkManagement;

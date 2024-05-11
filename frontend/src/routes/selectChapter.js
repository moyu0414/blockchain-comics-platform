import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import createWork from '../contracts/CreateWork_New.json';
import Web3 from 'web3';

const SelectChapter = () => {
  const [chapters, setChapters] = useState([]);
  const { hash } = useParams();

  useEffect(() => {
    const fetchChapters = async () => {
      try {
        if (hash) {
          const web3 = new Web3(window.ethereum);
          const contractInstance = new web3.eth.Contract(createWork.abi, createWork.address);
          const chapterHashes = await contractInstance.methods.getChapterHashes(hash).call();
          
          const chaptersData = [];
          for (let i = 0; i < chapterHashes.length; i++) {
            const chapterInfo = await fetchChapterInfo(contractInstance, hash, chapterHashes[i]);
            console.log('Chapter info:', chapterInfo);
            chaptersData.push(chapterInfo);
          }
    
          setChapters(chaptersData);
        } else {
          console.error('Comic hash is null');
        }
      } catch (error) {
        console.error('Error fetching chapters:', error);
      }
    };

    const fetchChapterInfo = async (contractInstance, comicHash, chapterHash) => {
      try {
        console.log("Comic hash:", comicHash);
        console.log("Chapter hash:", chapterHash);
        const chapterInfo = await contractInstance.methods.comicChapters(comicHash).call();
        console.log('Chapter raw info:', chapterInfo);
        return {
          title: chapterInfo.title,
          price: chapterInfo.price
        };
      } catch (error) {
        console.error('Error fetching chapter info:', error);
        return null;
      }
    };

    fetchChapters();
  }, [hash]);

  const handlePurchase = (chapterId) => {
    console.log(`Purchased chapter with ID: ${chapterId}`);
  };

  return (
    <div className="select-chapter-page">
      <div className="page-content">
        <h1>章節選擇</h1>
        <div className="chapter-selection">
          <table className="table table-image">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">本集標題</th>
                <th scope="col">價格</th>
                <th scope="col">操作</th>
              </tr>
            </thead>
            <tbody>
              {chapters.map((chapter, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td className='chapter-title'>{chapter.title}</td>
                  <td>{chapter.price}</td>
                  <td>
                    <button onClick={() => handlePurchase(chapter.id)} className="btn btn-primary">購買</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SelectChapter;
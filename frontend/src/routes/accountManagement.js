import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import comicData from '../contracts/ComicPlatform.json';
import Web3 from 'web3';
import $ from 'jquery';

const ComicManagement = ({ contractAddress }) =>  {

  return (
    <div className="management-page">
      <h2 className="title-text">管理者_帳號管理</h2>
      <div className="page-content">
        <div className="chapter-selection">
          <table className="table table-image">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">作者帳號</th>
                <th scope="col"></th>
              </tr>
            </thead>
            <tbody>
                <tr>
                  <td>1</td>
                  <td className='chapter-title'>0xb4C39375f9cBCCdD5dA4423F210A74f7Cbd110B7</td>
                  {/* <td>
                    <button onClick={() => handlePurchase(index)} className="btn" value={chapter.isBuying}>{chapter.isBuying}</button>
                  </td> */}
                </tr>
                <tr>
                  <td>2</td>
                  <td className='chapter-title'>0xC6Bf9f4E9C1042Ca3aF0a33ce51506c3a123162c</td>
                  {/* <td>
                    <button onClick={() => handlePurchase(index)} className="btn" value={chapter.isBuying}>{chapter.isBuying}</button>
                  </td> */}
                </tr>
                <tr>
                  <td>3</td>
                  <td className='chapter-title'>0x25D24F03a642f90Ede6413A393E7a4027467D275</td>
                  {/* <td>
                    <button onClick={() => handlePurchase(index)} className="btn" value={chapter.isBuying}>{chapter.isBuying}</button>
                  </td> */}
                </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ComicManagement;

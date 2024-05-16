import React from 'react';

const TransactionHistory = () => {
  return (
    <div className='history-page'>
      <h2>交易紀錄</h2>
      <table className="table">
        <thead>
          <tr>
            <th>交易項目</th>
            <th>交易時間</th>
            <th>交易金額</th>
            <th>手續費</th>
          </tr>
        </thead>
        <tbody>
            <tr >
                <td></td>
                <td></td>
                <td></td>
                <td></td>
            </tr>
        </tbody>
      </table>
    </div>
  );
};

export default TransactionHistory;

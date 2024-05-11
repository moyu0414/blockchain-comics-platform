import Web3 from 'web3';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import createWork from '../contracts/CreateWork_New.json';
import { Buffer } from 'buffer';
import bs58 from 'bs58'


const CreatorPage = (contractInstance) => {
  const [account, setAccount] = useState('');
  const [img, setImg] = useState('');

  let comicHashArray = [];

  const initContract = async () => {
    try {
      const web3 = new Web3(window.ethereum);
      const contractInstance = new web3.eth.Contract(createWork.abi, createWork.address);
      console.log(contractInstance);

      // 獲取用戶帳戶
      const accounts = await web3.eth.getAccounts();
      setAccount(accounts[0]);

      const meta = await contractInstance.methods;
      console.log(meta);

      // 找出此帳戶所有創作的漫畫
      let allComicHashes = await meta.getAllComicHashes().call();
      for (var i = 0; i < allComicHashes.length; i++) {
        let comics = await meta.comics(allComicHashes[i]).call();
        //console.log(comics);
        let comics_author = comics[2];
        console.log(comics_author);
        if (comics_author == account){
          let temp_cid = getIpfsHashFromBytes32(allComicHashes[i]);
          comicHashArray.push("https://gateway.pinata.cloud/ipfs/" + temp_cid);
          setImg("https://gateway.pinata.cloud/ipfs/" + temp_cid);
        };
      };
      console.log(comicHashArray);


    } catch (error) {
      console.error('Error initializing contract:', error);
    }
  };


  // 將 32 bytes 還原成 CID
  function getIpfsHashFromBytes32(bytes32Hex) {
    // Add our default ipfs values for first 2 bytes:
    // function:0x12=sha2, size:0x20=256 bits
    // and cut off leading "0x"
    const hashHex = "1220" + bytes32Hex.slice(2);
    console.log(hashHex);
    const hashBytes = Buffer.from(hashHex, 'hex');
    console.log(hashBytes);
    const hashStr = bs58.encode(hashBytes)
    return hashStr
  };
  

  useEffect(() => {
    initContract();
  }, []);


  return (
    <div className="container">
      <div className="d-flex justify-content-end mt-3">
      <Button variant="primary">
        <Link to="/createWork" style={{ textDecoration: 'none', color: 'inherit' }}>
          上傳作品
        </Link>
      </Button>
      </div>

      <div className="row mt-5 mb-5">


        <div className="col-3">
          <Link to="/comic1">
            <img src={img} alt="Comic 2" className="img-fluid"  />
          </Link> 
        </div>

        <div className="col-3">
          <Link to="/comic2">
            <img src={require("../image/comic2.png")} alt="Comic 2" className="img-fluid" />
          </Link>
        </div>

        <div className="col-3">
          <Link to="/comic3">
            <img src={require("../image/comic3.png")} alt="Comic 3" className="img-fluid" />
          </Link>
        </div>

        <div className="col-3">
          <Link to="/comic4">
            <img src={require("../image/comic4.png")} alt="Comic 4" className="img-fluid" />
          </Link>
        </div>


      </div>
    </div>
  );
};

export default CreatorPage;

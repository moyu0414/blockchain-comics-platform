/**
 *Submitted for verification at Etherscan.io on 2024-05-08
*/

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ComicPlatform {
    // 定義章節結構體
    struct Chapter {
        uint256 price; // 章節價格
        string title; // 章節標題
        bytes32 chapterHash; // 章節哈希
    }

    // 定義漫畫結構體
    struct Comic {
        address payable owner; // 漫畫所有者的錢包地址
        string title; // 漫畫標題
        string author; // 漫畫作者
        string description; // 漫畫描述
        uint8 level; //漫畫分級
    }

    // 儲存已上傳的漫畫
    mapping(bytes32 => Comic) public comics;
    // 儲存每本漫畫的章節信息
    mapping(bytes32 => Chapter[]) public comicChapters;
    // 記錄每個地址購買的章節
    mapping(address => mapping(bytes32 => bool)) public purchasedChapters; 

    bytes32[] public allComicHashes;
    // 定義漫畫上傳事件
    event ComicUploaded(
        bytes32 indexed comicHash,
        address indexed owner,
        string title,
        string author,
        string description,
        uint8 level 
    );
    event ChapterUploaded(
        bytes32 indexed comicHash,
        bytes32 indexed chapterHash,
        address indexed owner,
        string title,
        uint256 price
    );

    // 上傳漫畫功能
    function uploadComic(
        bytes32  _comicHash,
        string memory _title,
        string memory _author,
        string memory _description,
        uint8 _level 
    ) external {
        // 確認漫畫未重複上傳
        
        allComicHashes.push(_comicHash);

        require(comics[_comicHash].owner == address(0), "Comic already uploaded");

        // 將漫畫的識別符號標記為已上傳
        Comic storage newComic = comics[_comicHash];
        newComic.owner = payable(msg.sender);
        newComic.title = _title;
        newComic.author = _author;
        newComic.description = _description;
        newComic.level = _level;
        // 觸發漫畫上傳事件
        emit ComicUploaded(_comicHash, msg.sender, _title, _author, _description,_level);
    }

    // 添加章節功能
    function addChapter(
        bytes32  _comicHash,
        bytes32  _chapterHash,
        string memory _title,
        uint256 _price
    ) external {
        // 確認漫畫已上傳
        require(comics[_comicHash].owner != address(0), "Comic not uploaded");

        // 確認章節標題的唯一性
        require(comics[_comicHash].owner == msg.sender, "You are not owner");
        require(!chapterExists(_comicHash, _chapterHash), "Chapter already exists");
        require(titleExists(_comicHash,_title), "title already exists");

        // 添加章節到漫畫的章節信息中
        Chapter memory newChapter = Chapter({
            price: _price,
            title: _title,
            chapterHash:_chapterHash
        }); 

        comicChapters[_comicHash].push(newChapter);
        emit ChapterUploaded(_comicHash,_chapterHash, msg.sender, _title, _price);
    }

    // 檢查章節是否已存在
    function chapterExists(bytes32 _comicHash, bytes32 _chapterHash) internal  view returns (bool) {
        Chapter[] memory chapters = comicChapters[_comicHash];
        for (uint256 i = 0; i < chapters.length; i++) {
            if (chapters[i].chapterHash == _chapterHash) {
                return true;
            }
        }
        return false;
    }
    function titleExists(bytes32 _comicHash, string memory _title) internal view returns (bool) {
        Chapter[] memory chapters = comicChapters[_comicHash];
        for (uint256 i = 0; i < chapters.length; i++) {
            if (keccak256(abi.encodePacked(chapters[i].title)) == keccak256(abi.encodePacked(_title))) {
                return false;
            }
        }
    return true;
    }

    function getAllComicHashes() external view returns (bytes32[] memory,string[] memory) {
        string[] memory titles = new string[](allComicHashes.length);
        for (uint256 i = 0; i < allComicHashes.length; i++) {
            titles[i] = comics[allComicHashes[i]].title;
        }
        return(allComicHashes,titles);
    }

    function getChapters(bytes32 _comicHash) external view returns (bytes32[] memory, string[] memory, uint256[] memory) {
        Chapter[] memory chapters = comicChapters[_comicHash];
        bytes32[] memory hashes = new bytes32[](chapters.length);
        string[] memory titles = new string[](chapters.length);
        uint256[] memory prices = new uint256[](chapters.length);

       for (uint256 i = 0; i < chapters.length; i++) {
            hashes[i] = chapters[i].chapterHash;
            titles[i] = chapters[i].title;
            prices[i] = chapters[i].price;
        }
        return (hashes, titles, prices);
    }
        // 漫畫章節的購買記錄
    mapping(bytes32 => mapping(bytes32 => address[])) public chapterPurchases;
    mapping(address => bytes32[]) public userPurchases;
    
    event ChapterPurchased( //購買事件
        bytes32 indexed comicHash,
        bytes32 indexed chapterHash,
        address indexed buyer,
        uint256 price
    );
    // 購買章節
    function purchaseChapter(bytes32 _comicHash, bytes32 _chapterHash) external payable {
        // 檢查章節是否存在
        require(chapterExists(_comicHash, _chapterHash), "Chapter does not exist");

        // 檢查是否已購買過此章節
        require(!hasPurchasedChapter(_comicHash, _chapterHash, msg.sender), "Chapter already purchased");

        // 檢查支付的價格是否正確
        uint256 price = getChapterPrice(_comicHash, _chapterHash);
        require(msg.value >= price, "Insufficient payment");

        // 儲存購買記錄
        chapterPurchases[_comicHash][_chapterHash].push(msg.sender);
        userPurchases[msg.sender].push(_comicHash);
        comics[_comicHash].owner.transfer(price);

        // 觸發購買事件
        emit ChapterPurchased(_comicHash, _chapterHash, msg.sender, price);
    }

    // 檢查是否已購買章節
    function hasPurchasedChapter(bytes32 _comicHash, bytes32 _chapterHash, address _buyer) internal view returns (bool) {
        address[] memory buyers = chapterPurchases[_comicHash][_chapterHash];
        for (uint256 i = 0; i < buyers.length; i++) {
            if (buyers[i] == _buyer) {
                return true;
            }
        }
        return false;
    }

    // 獲取章節價格
    function getChapterPrice(bytes32 _comicHash, bytes32 _chapterHash) internal view returns (uint256) {
        Chapter[] memory chapters = comicChapters[_comicHash];
        for (uint256 i = 0; i < chapters.length; i++) {
            if (chapters[i].chapterHash == _chapterHash) {
                return chapters[i].price;
            }
        }
        revert("Chapter not found");
    }

    //獲取使用者購買漫畫
    function getmycomics() external view returns (bytes32[] memory, string[] memory) {
        string[] memory titles = new string[](userPurchases[msg.sender].length);
        for (uint256 i = 0; i < titles.length; i++) {
            titles[i] = comics[userPurchases[msg.sender][i]].title ;
        }
        return(userPurchases[msg.sender],titles);
    } 

}
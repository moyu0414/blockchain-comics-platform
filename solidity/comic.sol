// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "Base58.sol";

contract ComicPlatform {
    // 定義章節結構體
    struct Chapter {
        uint256 price; // 章節價格
        string title; // 章節標題
        string chapterHash; // 章節哈希
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
    mapping(string => Comic) public comics;
    // 儲存每本漫畫的章節信息
    mapping(string => Chapter[]) public comicChapters;

    string[] public allComicHashes;
    // 定義漫畫上傳事件
    event ComicUploaded(
        string indexed comicHash,
        address indexed owner,
        string title,
        string author,
        string description,
        uint8 level 
    );
    event ChapterUploaded(
        string indexed comicHash,
        string indexed chapterHash,
        address indexed owner,
        string title,
        uint256 price
    );

    // 上傳漫畫功能
    function uploadComic(
        string memory _comicHash,
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
        string memory _comicHash,
        string memory _chapterHash,
        string memory _title,
        uint256 _price
    ) external {
        // 確認漫畫已上傳
        require(comics[_comicHash].owner != address(0), "Comic not uploaded");

        // 確認章節標題的唯一性
        require(comics[_comicHash].owner == msg.sender, "You are not owner");
        require(chapterExists(_comicHash, _chapterHash), "Chapter already exists");
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
    function chapterExists(string memory _comicHash, string memory _chapterHash) internal view returns (bool) {
        Chapter[] memory chapters = comicChapters[_comicHash];
        for (uint256 i = 0; i < chapters.length; i++) {
            if (compareBytes(chapters[i].chapterHash,_chapterHash)) {
                return false;
            }
        }
        return true;
    }
    function titleExists(bytes memory _comicHash, string memory _title) internal view returns (bool) {
        bytes32 titleHash = keccak256(abi.encodePacked(_title));
        Chapter[] memory chapters = comicChapters[_comicHash];
        for (uint256 i = 0; i < chapters.length; i++) {
            if (keccak256(abi.encodePacked(chapters[i].title)) == titleHash) {
                return false;
            }
        }
    return true;
    }
    function getAllCID() external view returns (bytes[] memory) {
        return allComicHashes;
    }
    function compareBytes(bytes memory a, bytes memory b) internal pure returns (bool) {
        return keccak256(a) == keccak256(b);
    }
}
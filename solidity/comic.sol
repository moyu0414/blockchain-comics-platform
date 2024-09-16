// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;


import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract ComicPlatform is ERC721, Ownable , ReentrancyGuard {
    uint256 public tokenCounter;

    constructor(address initialOwner) Ownable(initialOwner) ERC721("ComicNFT", "CNFT") {
        tokenCounter = 0;
        admins[initialOwner] = true; // 将初始拥有者设为管理者
        admins[0xC6Bf9f4E9C1042Ca3aF0a33ce51506c3a123162c] = true;
        admins[0xb4C39375f9cBCCdD5dA4423F210A74f7Cbd110B7] = true;
    }
    

    // 定義章節結構體
    struct Chapter {
        uint256 price; // 章節價格
    }
    // 定義漫畫結構體
    struct Comic {
        address payable owner; // 漫畫所有者的錢包地址
        uint256 status; // 漫畫是否存在
    }
    // 定義NFT結構體
    struct NFT {
        uint256 tokenId;
        bytes32 comicHash;
        address minter;
        uint256 price;
        string description;
        bool forSale;
        uint256 royalty; // 自定版税率
    }

    // 儲存NFT
    mapping(uint256 => NFT) public nfts;
    // 儲存已上傳的漫畫
    mapping(bytes32 => Comic) public comics;
    // 儲存每本漫畫的章節信息
    mapping(bytes32 => mapping(bytes32 => Chapter)) public comicChapterdata;
    // 儲存每本漫畫的章節信息
    mapping(bytes32 => bytes32[]) public comicChapters;
    // 記錄每個地址購買的章節
    mapping(address => mapping(bytes32 => bool)) public purchasedChapters;
    // 記錄每個地址購買的章節
    mapping(bytes32 => address[]) public purchaserecord;
    //記錄每本漫畫的章節的hash，保持唯一性
    mapping(bytes32 => mapping(bytes32 => bool)) private comicChapterhashs;
    // 管理者列表
    mapping(address => bool) public admins;
    // 創作者列表
    mapping(address => bool) public creators;
    //首頁 all漫畫hash
    bytes32[] public allComicHashes;

    modifier onlyAdmin() {
        require(admins[msg.sender], "Caller is not an admin");
        _;
    }
    modifier onlyCreator() {
        require(creators[msg.sender], "Caller is not an creator");
        _;
    }

    function addAdmin(address newAdmin) external onlyAdmin {
        admins[newAdmin] = true;
    }

    function addCreator(address newCreator) external onlyAdmin {
        creators[newCreator] = true;
    }

    function removeAdmin(address admin) external onlyAdmin {
        require(admin != msg.sender, "Admin cannot remove themselves");
        admins[admin] = false;
    }

    function removeCreator(address creator) external onlyAdmin {
        creators[creator] = false;
    }

    // 定義漫畫上傳事件
    event ComicUploaded(
        bytes32 indexed comicHash,
        address indexed owner,
        string newtitle
    );
    // 定義漫畫編輯事件
    event ComicEdited(
        bytes32 indexed comicHash,
        address indexed owner,
        string title
    );
    //定義章節上傳事件
    event ChapterUploaded(
        bytes32 indexed comicHash,
        bytes32 indexed chapterHash,
        address indexed owner,
        string title,
        uint256 price
    );
    //定義章節編輯事件
    event ChapterEdited(
        bytes32 indexed comicHash,
        bytes32 indexed chapterHash,
        address indexed owner,
        string newtitle,
        uint256 newprice
    );
    //定義購買事件
    event ChapterPurchased(
        bytes32 indexed comicHash,
        bytes32 indexed chapterHash,
        address indexed buyer,
        uint256 price
    );
        // NFT相关事件
    event NFTMinted(uint256 tokenId, address owner, uint256 price, uint256 royalty, string description, bytes32 comicHash);
    event NFTPurchased(uint256 tokenId, address buyer, uint256 price);
    event NFTUpdated(uint256 tokenId, uint256 newPrice, bool forSale);
    event NFTDescriptionUpdated(uint256 tokenId,uint256 price, string description, uint256 royalty,bool forSale);


    // 上傳漫畫功能
    function uploadComic(bytes32 _comicHash,string memory _title) external onlyCreator{
        require(comics[_comicHash].owner == address(0),"Comic already uploaded"); // 確認漫畫未重複上傳
        
        //新增漫畫
        Comic memory newComic = Comic({owner:  payable(msg.sender),status: 0});
        comics[_comicHash]= newComic; 
        allComicHashes.push(_comicHash); 

        // 觸發漫畫上傳事件
        emit ComicUploaded(_comicHash,msg.sender,_title);
    }
    //修改漫畫狀態
    function toggleComicExistence(bytes32 _comicHash,uint256 status) external payable onlyAdmin {
        require(comics[_comicHash].owner != address(0), "Comic does not exist");
        require(status == 0 || status == 1 || status == 2, "Invalid status");


        if (status == 2) {
            uint256 totalCost = 0;
            
            // 確認所有NFT是否都可以購買以及計算總價
            for (uint256 i = 0; i < comicChapters[_comicHash].length; i++) {
                bytes32 _chapterhash = comicChapters[_comicHash][i];
                uint256 _cnt = purchaserecord[_chapterhash].length;
                totalCost += comicChapterdata[_comicHash][_chapterhash].price * _cnt;
            }

            require(msg.value >= totalCost, "Insufficient payment");

            for (uint256 i = 0; i < comicChapters[_comicHash].length; i++) {
                bytes32 _chapterhash = comicChapters[_comicHash][i];
                for (uint256 n = 0; n < purchaserecord[_chapterhash].length; n++) {
                    uint256 _price = comicChapterdata[_comicHash][_chapterhash].price;
                    address receiver = purchaserecord[_chapterhash][n];
                    payable(receiver).transfer(_price);
                }
            }
        }

        comics[_comicHash].status = status;
    }

    // 添加章節功能
    function addChapter(bytes32 _comicHash,bytes32 _chapterHash,string memory _title,uint256 _price) external {
        require(comics[_comicHash].status == 0 , "Comic does not exist");//確認漫畫是否存在
        require(comics[_comicHash].owner == msg.sender, "You are not owner"); // 確認是否為擁有者
        require(!comicChapterhashs[_comicHash][_chapterHash],"Chapter already exists"); //確認章節唯一性

        // 添加章節到漫畫的章節信息中
        Chapter memory newChapter = Chapter({price: _price});

        comicChapterdata[_comicHash][_chapterHash] = newChapter; //新增章節
        comicChapters[_comicHash].push(_chapterHash); //新增章節
        comicChapterhashs[_comicHash][_chapterHash] = true; // 將章節hash標記為已存在

        emit ChapterUploaded(_comicHash,_chapterHash,msg.sender, _title ,_price);
    }

    // 編輯漫畫功能
    function editComic(bytes32 _comicHash,string memory _title) external {
        require(comics[_comicHash].status == 0, "Comic does not exist");//確認漫畫是否存在
        require(comics[_comicHash].owner == msg.sender, "You are not owner"); // 確認是否為擁有者
        
        emit ComicEdited(_comicHash, msg.sender, _title);
    }
    // 編輯章節功能
    function editChapter(bytes32 _comicHash,bytes32 _chapterHash,string memory _title,uint256 _price) external {
        require(comics[_comicHash].status == 0, "Comic does not exist");//確認漫畫是否存在
        require(comics[_comicHash].owner == msg.sender, "You are not owner"); // 確認是否為擁有者

        comicChapterdata[_comicHash][_chapterHash].price = _price; //修改價格
        
        emit ChapterEdited(_comicHash, _chapterHash, msg.sender, _title, _price);
    }
    // 購買章節
    function purchaseChapter(bytes32 _comicHash, bytes32 _chapterHash,uint256 gasfee)external payable{
        require(comics[_comicHash].status == 0, "Comic does not exist");// 檢查漫畫是否存在
        require(comicChapterhashs[_comicHash][_chapterHash],"Chapter does not exists");/// 檢查章節是否存在
        require(!purchasedChapters[msg.sender][_chapterHash],"Chapter already purchased");// 檢查是否已購買過此章節

        // 檢查支付的價格是否正確
        uint256 price = comicChapterdata[_comicHash][_chapterHash].price;
        require(msg.value >= price, "Insufficient payment");

        // 扣除手續費
        uint256 fee = price / 10; // 10%的手續費
        uint256 netPrice = price - fee;

        // 將章節價格支付給漫畫擁有者
        (bool sentToOwner, ) = comics[_comicHash].owner.call{value: netPrice}("");
        require(sentToOwner, "Failed to send Ether to the comic owner");

        // 退還燃料費
        require(fee >= gasfee, "Gas fee exceeds the fee");
        (bool refundGas, ) = msg.sender.call{value: gasfee}("");
        require(refundGas, "Failed to refund gas fee");
        
        // 儲存購買記錄
        purchasedChapters[msg.sender][_chapterHash] = true;
        purchaserecord[_chapterHash].push(msg.sender);

        // 觸發購買事件
        emit ChapterPurchased(_comicHash, _chapterHash, msg.sender, price);
    }

    // 管理者提取手續費
    function withdrawFees() external onlyAdmin {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        payable(msg.sender).transfer(balance);
    }
    function getContractBalance() external view onlyAdmin returns (uint256)  {
        return address(this).balance;
    }

    // NFT功能 - 铸造NFT
    function _mintNFT(uint256 price, string memory description, uint256 royalty, uint256 quality, bytes32 comichash) external {
        require(royalty <= 10, "Royalty cannot exceed 10%");
        for (uint256 i = 0; i < quality; i++) {
            uint256 newTokenId = tokenCounter;
            _mint(msg.sender, newTokenId);

            nfts[newTokenId] = NFT({
                tokenId: newTokenId,
                comicHash: comichash,
                minter: msg.sender,
                price: price,
                description: description,
                forSale: true,
                royalty: royalty
            });

        emit NFTMinted(newTokenId, msg.sender, price, royalty, description, comichash);
            tokenCounter++;
        }
        
    }
    
    // 允许所有者更新价格和销售状态
    function updateNFT(uint256 _tokenId, uint256 newPrice, bool forSale) external {
        require(ownerOf(_tokenId) == msg.sender, "Only the owner can update the NFT");
        nfts[_tokenId].price = newPrice;
        nfts[_tokenId].forSale = forSale;

        emit NFTUpdated(_tokenId, newPrice, forSale);
    }

    // 允许minter更新
    function updateNFTDescription(uint256 _tokenId,uint256 price, string memory description, uint256 royalty, bool forSale) external {
        require(nfts[_tokenId].minter == msg.sender, "Only the minter can update the data");
        require(ownerOf(_tokenId) == msg.sender, "Only the owner can update the NFT");
        nfts[_tokenId].description = description;
        nfts[_tokenId].price = price;
        nfts[_tokenId].royalty = royalty;
        nfts[_tokenId].forSale = forSale;

        emit NFTDescriptionUpdated(_tokenId, price, description, royalty, forSale);
    }
    // 购买NFT函数，包含2%抽成和版税逻辑
    function purchaseNFT(uint256[] calldata _tokenIds) external payable nonReentrant {
        uint256 totalCost = 0;

        // 確認所有NFT是否都可以購買以及計算總價
        for (uint256 i = 0; i < _tokenIds.length; i++) {
            uint256 tokenId = _tokenIds[i];
            require(nfts[tokenId].forSale, "One or more NFTs are not for sale");
            require(ownerOf(tokenId) != msg.sender, "Cannot purchase your own token");

            totalCost += nfts[tokenId].price;
        }
        
        require(msg.value >= totalCost, "Insufficient payment");

        // 處理每個NFT的購買
        for (uint256 i = 0; i < _tokenIds.length; i++) {
            uint256 tokenId = _tokenIds[i];
            address tokenOwner = ownerOf(tokenId);

            uint256 salePrice = nfts[tokenId].price;
            uint256 fee = salePrice * 2 / 100; // 2% 抽成
            uint256 royalty = salePrice * nfts[tokenId].royalty / 100; // 自定义版税
            uint256 netPrice = salePrice - fee - royalty;

            // 轉移NFT
            _transfer(tokenOwner, msg.sender, tokenId);

            // 支付賣家
            payable(tokenOwner).transfer(netPrice);
            
            // 支付版税給minter
            payable(nfts[tokenId].minter).transfer(royalty);

            nfts[tokenId].forSale = false; //剛購買設定為不轉售

            emit NFTPurchased(tokenId, msg.sender, salePrice);
        }
    }

    // 重写转移函数以确保交易只能通过合约
    function transferFrom(address from, address to, uint256 tokenId) public override {
        require(msg.sender == address(this), "Only contract can transfer");
        super.transferFrom(from, to, tokenId);
    }
    
    function getNFTDetails(uint256 _tokenId) external view returns (bytes32, string memory, uint256, uint256,bool) {
        require(nfts[_tokenId].tokenId != 0, "Token does not exist");
        NFT storage nft = nfts[_tokenId];
        return (nft.comicHash, nft.description, nft.price, nft.royalty, nft.forSale);
    }
}
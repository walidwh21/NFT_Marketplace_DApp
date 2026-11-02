// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

/// @title NFTMarketplace
/// @notice Mints ERC-721 tokens and lists them in an escrow-style fixed-price market.
/// @dev Listed tokens are held by this contract until sold. A flat listing fee is
///      charged per listing and forwarded to the marketplace operator on sale.
contract NFTMarketplace is ERC721URIStorage, ReentrancyGuard {
    using Counters for Counters.Counter;

    struct MarketItem {
        uint256 tokenId;
        address payable seller;
        address payable owner;
        uint256 price;
        bool sold;
    }

    Counters.Counter private _tokenIds;
    Counters.Counter private _itemsSold;

    address payable private immutable operator;
    uint256 private listingFee = 0.025 ether;
    mapping(uint256 => MarketItem) private items;

    event MarketItemCreated(
        uint256 indexed tokenId,
        address seller,
        address owner,
        uint256 price,
        bool sold
    );

    modifier onlyOperator() {
        require(msg.sender == operator, "Caller is not the marketplace operator");
        _;
    }

    constructor() ERC721("Marketplace Token", "MKT") {
        operator = payable(msg.sender);
    }

    // ---------------------------------------------------------------- admin

    function updateListingPrice(uint256 newFee) public payable onlyOperator {
        listingFee = newFee;
    }

    function getListingPrice() public view returns (uint256) {
        return listingFee;
    }

    // -------------------------------------------------------------- listing

    /// @notice Mint a new token and list it for `price` wei.
    function createToken(string memory tokenURI, uint256 price)
        public
        payable
        returns (uint256)
    {
        _tokenIds.increment();
        uint256 tokenId = _tokenIds.current();

        _mint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);
        _list(tokenId, price);
        return tokenId;
    }

    /// @notice Re-list a token you bought earlier.
    function resellToken(uint256 tokenId, uint256 price) public payable {
        MarketItem storage item = items[tokenId];
        require(item.owner == msg.sender, "Only the item owner can resell");
        require(msg.value == listingFee, "Send exactly the listing fee");
        require(price > 0, "Price must be greater than zero");

        item.sold = false;
        item.price = price;
        item.seller = payable(msg.sender);
        item.owner = payable(address(this));
        _itemsSold.decrement();

        _transfer(msg.sender, address(this), tokenId);
    }

    function _list(uint256 tokenId, uint256 price) private {
        require(price > 0, "Price must be greater than zero");
        require(msg.value == listingFee, "Send exactly the listing fee");

        items[tokenId] = MarketItem(
            tokenId,
            payable(msg.sender),
            payable(address(this)),
            price,
            false
        );
        _transfer(msg.sender, address(this), tokenId);
        emit MarketItemCreated(tokenId, msg.sender, address(this), price, false);
    }

    // ---------------------------------------------------------------- sales

    /// @notice Buy a listed token at its asking price.
    function createMarketSale(uint256 tokenId) public payable nonReentrant {
        MarketItem storage item = items[tokenId];
        require(item.owner == address(this), "Item is not for sale");
        require(msg.value == item.price, "Send exactly the asking price");

        address payable seller = item.seller;

        // effects
        item.owner = payable(msg.sender);
        item.seller = payable(address(0));
        item.sold = true;
        _itemsSold.increment();

        // interactions
        _transfer(address(this), msg.sender, tokenId);
        _pay(operator, listingFee);
        _pay(seller, msg.value);
    }

    function _pay(address payable to, uint256 amount) private {
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "Payment failed");
    }

    // ---------------------------------------------------------------- views

    /// @notice Items currently escrowed in the marketplace (i.e. for sale).
    function fetchMarketItems() public view returns (MarketItem[] memory) {
        return _collect(address(this), false);
    }

    /// @notice Items owned by the caller.
    function fetchMyNFTs() public view returns (MarketItem[] memory) {
        return _collect(msg.sender, false);
    }

    /// @notice Items the caller has listed (as seller).
    function fetchItemsListed() public view returns (MarketItem[] memory) {
        return _collect(msg.sender, true);
    }

    function _collect(address who, bool bySeller)
        private
        view
        returns (MarketItem[] memory result)
    {
        uint256 total = _tokenIds.current();
        uint256 count;
        for (uint256 id = 1; id <= total; id++) {
            if (_matches(items[id], who, bySeller)) count++;
        }

        result = new MarketItem[](count);
        uint256 cursor;
        for (uint256 id = 1; id <= total; id++) {
            if (_matches(items[id], who, bySeller)) result[cursor++] = items[id];
        }
    }

    function _matches(MarketItem storage item, address who, bool bySeller)
        private
        view
        returns (bool)
    {
        return bySeller ? item.seller == who : item.owner == who;
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IERC721Transfer {
    function transferFrom(address from, address to, uint256 tokenId) external;
}

/// @title DutchAuction
/// @notice Price falls linearly every second until someone buys or the auction expires.
/// @dev Standalone example; not wired into the UI. The seller must approve this
///      contract for `tokenId` before buyers can call `buy`.
contract DutchAuction {
    uint256 public constant DURATION = 7 days;

    IERC721Transfer public immutable token;
    uint256 public immutable tokenId;
    address payable public immutable seller;
    uint256 public immutable startingPrice;
    uint256 public immutable discountPerSecond;
    uint256 public immutable startAt;
    uint256 public immutable expiresAt;
    bool public settled;

    constructor(
        uint256 _startingPrice,
        uint256 _discountPerSecond,
        address _token,
        uint256 _tokenId
    ) {
        require(
            _startingPrice >= _discountPerSecond * DURATION,
            "Starting price too low for this discount rate"
        );
        seller = payable(msg.sender);
        startingPrice = _startingPrice;
        discountPerSecond = _discountPerSecond;
        startAt = block.timestamp;
        expiresAt = block.timestamp + DURATION;
        token = IERC721Transfer(_token);
        tokenId = _tokenId;
    }

    function currentPrice() public view returns (uint256) {
        return startingPrice - discountPerSecond * (block.timestamp - startAt);
    }

    function buy() external payable {
        require(!settled, "Already sold");
        require(block.timestamp < expiresAt, "Auction has ended");

        uint256 price = currentPrice();
        require(msg.value >= price, "Not enough ETH sent");
        settled = true;

        token.transferFrom(seller, msg.sender, tokenId);
        (bool paid, ) = seller.call{value: price}("");
        require(paid, "Payout failed");

        uint256 refund = msg.value - price;
        if (refund > 0) {
            (bool refunded, ) = payable(msg.sender).call{value: refund}("");
            require(refunded, "Refund failed");
        }
    }
}

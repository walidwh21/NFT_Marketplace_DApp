// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/// @title TransferFunds
/// @notice On-chain ledger of wallet-to-wallet transfers with an attached note.
/// @dev The ETH itself is moved by the sender's wallet; this contract only records it.
contract TransferFunds {
    struct TransferRecord {
        address sender;
        address receiver;
        uint256 amount;
        string message;
        uint256 timestamp;
    }

    event TransferEvent(
        address from,
        address receiver,
        uint256 amount,
        string message,
        uint256 timestamp
    );

    TransferRecord[] private records;

    function addDataToBlockchain(
        address payable receiver,
        uint256 amount,
        string memory message
    ) public {
        records.push(
            TransferRecord(msg.sender, receiver, amount, message, block.timestamp)
        );
        emit TransferEvent(msg.sender, receiver, amount, message, block.timestamp);
    }

    function getAllTransactions() public view returns (TransferRecord[] memory) {
        return records;
    }

    function getTransactionCount() public view returns (uint256) {
        return records.length;
    }
}

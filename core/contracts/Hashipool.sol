// SPDX-License-Identifier: Apache 2

pragma solidity ^0.8.0;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol";

// A partial ERC20 interface.
interface IERC20 {
    function allowance(address owner, address spender) external view returns (uint256);
    function balanceOf(address owner) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool);
}

contract Hashipool is Ownable {

    address public bridgeContract;


    mapping(address => mapping(address => uint)) public stableStorage;
    mapping(address => uint) public totalStaked;

    event depositPool(uint amount, IERC20 token, address sender);
    event widthdrawPool(uint amount, IERC20 token, address sender);

    function updateBridgeContract(address _bridgeContract) external onlyOwner {
        bridgeContract = _bridgeContract;
    }

    function depositInPool(uint amount, IERC20 token) external payable {
        require(amount > 0, "Invalid Amount");

        require(token.balanceOf(msg.sender) >= amount, "Insufficient Balance!!");
        require(token.allowance(msg.sender, address(this)) >= amount, "Insufficient Allowance!!");

        token.transferFrom(msg.sender, address(this), amount);
        stableStorage[msg.sender][address(token)] += amount; 
        totalStaked[address(token)] += amount;

        emit depositPool(amount, token, msg.sender);
    }
        
    function widthdrawFromPool(uint amount, IERC20 token) external payable {
        require(amount > 0, "Invalid Amount");

        require(stableStorage[msg.sender][address(token)] >= amount, "Insufficient Staked Balance!!");

        stableStorage[msg.sender][address(token)] -= amount;
        totalStaked[address(token)] -= amount;
        token.transfer(msg.sender, amount);

        emit widthdrawPool(amount, token, msg.sender);
    }

    function useLiquidity(uint amount, IERC20 token, address transferTo) external payable {
        require(msg.sender == bridgeContract, "Not a whitelisted address!!");
        require(amount > 0, "Invalid Amount");

        require(token.balanceOf(address(this)) > amount, "Insufficient Liquidity");

        totalStaked[address(token)] -= amount;
        token.transfer(transferTo, amount);
    }
    
}
// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

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

contract Hashiswap {

    address public exchangeProxy;

    constructor(address _exchangeProxy) {
        exchangeProxy = _exchangeProxy;
    }


    function executeSingleChainSwap(IERC20 sellToken, IERC20 buyToken, address spender, uint amount, address payable swapTarget, bytes calldata swapCallData, address receiver) external payable returns (uint256 boughtAmount) {
        require(amount >= sellToken.balanceOf(msg.sender), "Insufficient Balance!!!");
        require(amount >= sellToken.allowance(msg.sender, address(this)), "Insufficient Allowance!!");
        require(swapTarget == exchangeProxy, "Target not ExchangeProxy");

        require(sellToken.approve(spender, type(uint128).max));
        
        boughtAmount = buyToken.balanceOf(address(this));

        sellToken.transferFrom(msg.sender, address(this), amount);

        (bool success,) = swapTarget.call{value: msg.value}(swapCallData);
        require(success, 'SWAP_CALL_FAILED');

        boughtAmount = buyToken.balanceOf(address(this)) - boughtAmount;

        buyToken.transfer(receiver, boughtAmount);
    } 

}
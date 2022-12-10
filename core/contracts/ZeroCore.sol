// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

pragma abicoder v2;

import "https://github.com/LayerZero-Labs/solidity-examples/blob/main/contracts/lzApp/NonblockingLzApp.sol";

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

interface IHashipool {
    function useLiquidity(uint amount, IERC20 token, address transferTo) external payable;
}

contract ZeroCore is NonblockingLzApp {

    IHashipool hashipool;
    mapping(uint32 => bool) public domains;
    mapping(address => bool) public inboxes;
    struct ChainObject {
        uint32 domain;
        address outbox;
    }

    modifier onlyEthereumInbox(uint32 origin) {
        require(domains[origin] && inboxes[msg.sender]);
        _;    
    }

    event SentMessage(uint16 destinationDomain, address recipient, bytes message);
    event ReceivedMessage(uint16 _srcChainId, bytes _srcAddress, bytes message);

    constructor (address _lzEndpoint, address _hashipool) NonblockingLzApp(_lzEndpoint) {
        hashipool = IHashipool(_hashipool);
    }

    function toggleDomain(uint32 _domain, bool enabled) external onlyOwner {
        domains[_domain] = enabled;
    }

    function toggleInboxes(address _inbox, bool enabled) external onlyOwner {
        inboxes[_inbox] = enabled;
    }

    function addressToBytes32(address _addr) internal pure returns (bytes32) {
        return bytes32(uint256(uint160(_addr)));
    }

    function bytes32ToAddress(bytes32 _buf) internal pure returns (address) {
        return address(uint160(uint256(_buf)));
    }

    // To send message to Hyperlane
    function sendMessage(
        uint16 _destinationDomain,
        address _recipient,
        bytes memory _message
    ) private {
        _lzSend(_destinationDomain, _message, payable(msg.sender), address(0x0), bytes(""), msg.value);
        emit SentMessage(_destinationDomain, _recipient, _message);
    }

    function initiateBridge(uint16 domain, address recipient, IERC20 multiChainToken, IERC20 sellToken, uint amount) public payable {

        require(sellToken.balanceOf(msg.sender) >= amount, "Insufficient Balance");
        require(sellToken.allowance(msg.sender, address(this)) >= amount, "Not Approved");

        sellToken.transferFrom((msg.sender),address(hashipool), amount);
        
        uint256 boughtAmount = amount;
        bytes memory message = abi.encode(boughtAmount, multiChainToken, msg.sender);

        sendMessage(domain, recipient, message);
    }

    // To receive the message from Hyperlane
    function _nonblockingLzReceive(
        uint16 _srcChainId,
        bytes calldata _srcAddress,
        uint64, 
        bytes calldata _message
    ) internal override {
        
        uint amount;
        address multiChainToken;
        address msgSender;

        (amount, multiChainToken, msgSender) = abi.decode(_message,(uint, address, address));
        hashipool.useLiquidity(amount, IERC20(multiChainToken), msgSender);

        emit ReceivedMessage(_srcChainId, _srcAddress, _message);
    }

}
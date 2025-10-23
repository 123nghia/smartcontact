// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TokenHubV2 is ERC20, ERC20Permit, Ownable {
    uint256 public constant INITIAL_SUPPLY = 100_000_000 * 10**18;

    constructor(address owner) 
        ERC20("Token Hub", "THD") 
        ERC20Permit("Token Hub") 
        Ownable()
    {
        require(owner != address(0), "TokenHubV2: owner is zero address");
        _transferOwnership(owner);
        _mint(owner, INITIAL_SUPPLY);
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    function burnFrom(address account, uint256 amount) external {
        _spendAllowance(account, msg.sender, amount);
        _burn(account, amount);
    }
}
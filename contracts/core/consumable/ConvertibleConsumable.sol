// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol';
import './Consumable.sol';
import './ConvertibleConsumableInterfaceSupport.sol';
import './IConvertibleConsumable.sol';
import './IConsumableExchange.sol';
import './ConsumableConversionMath.sol';

abstract contract ConvertibleConsumable is IConvertibleConsumable, Consumable {
  using SafeMath for uint256;
  using ConsumableConversionMath for uint256;

  IERC20 private _exchangeToken;

  // amount that 1 of exchangeToken will convert into this consumable
  // eg if exchangeRate is 1000, then 1000 this == 1 exchangeToken
  uint256 private _exchangeRate;

  function _initializeConvertibleConsumable(
    ContractInfo memory info,
    string memory symbol,
    IERC20 exchangeToken,
    uint256 exchangeRate,
    bool registerWithExchange
  ) internal initializer {
    _initializeConsumable(info, symbol);
    _registerInterface(ConvertibleConsumableInterfaceSupport.CONVERTIBLE_CONSUMABLE_INTERFACE_ID);

    require(exchangeRate > 0, 'ConvertibleConsumable: exchange rate must be > 0');

    // enhance: when ERC20 supports ERC165, check token here

    _exchangeToken = exchangeToken;
    _exchangeRate = exchangeRate;

    if (registerWithExchange) {
      _registerWithExchange();
    }
  }

  function exchangeToken() external override view returns (IERC20) {
    return _exchangeToken;
  }

  function exchangeRate() external override view returns (uint256) {
    return _exchangeRate;
  }

  function amountExchangeTokenAvailable() external override view returns (uint256) {
    uint256 amountNeeded = this.amountExchangeTokenNeeded(totalSupply());
    uint256 amountExchangeToken = _exchangeToken.balanceOf(address(this));
    if (amountNeeded >= amountExchangeToken) {
      return 0;
    }
    return amountExchangeToken - amountNeeded;
  }

  function _registerWithExchange() internal onlyEnabled {
    IConsumableExchange consumableExchange = IConsumableExchange(address(_exchangeToken));
    consumableExchange.registerToken(_exchangeRate);
  }

  function _transfer(
    address sender,
    address recipient,
    uint256 amount
  ) internal virtual override onlyEnabled {
    _exchangeIfNeeded(sender, amount);

    super._transfer(sender, recipient, amount);
  }

  function _exchangeIfNeeded(address sender, uint256 amount) internal onlyEnabled {
    uint256 senderBalance = this.balanceOf(sender);
    if (senderBalance < amount) {
      // no need to use SafeMath since we know that the sender balance < amount
      uint256 amountNeeded = amount - senderBalance;

      // assume that they wanted to convert since they knew they didn't have enough to transfer
      _mintByExchange(sender, amountNeeded);
    }
  }

  function mintByExchange(uint256 amount) external override {
    _mintByExchange(_msgSender(), amount);
  }

  /**
   * @dev Converts exchange token into `amount` of this consumable
   */
  function _mintByExchange(address account, uint256 amount) internal onlyEnabled {
    uint256 amountExchangeToken = this.amountExchangeTokenNeeded(amount);

    _exchangeToken.transferFrom(account, address(this), amountExchangeToken);

    _mint(account, amount);
  }

  function amountExchangeTokenNeeded(uint256 amount) external override view returns (uint256) {
    return amount.exchangeTokenNeeded(_exchangeRate);
  }

  function _mint(address account, uint256 amount) internal virtual override {
    super._mint(account, amount);

    uint256 amountNeeded = this.amountExchangeTokenNeeded(totalSupply());
    uint256 amountExchangeToken = _exchangeToken.balanceOf(address(this));
    require(amountExchangeToken >= amountNeeded, 'ConvertibleConsumable: Not enough exchange token available to mint');
  }

  function burnByExchange(uint256 amount) external virtual override {
    _burnByExchange(_msgSender(), amount);
  }

  /**
   * @dev Converts `amount` of this consumable into exchange token
   */
  function _burnByExchange(address receiver, uint256 amount) internal onlyEnabled {
    _burn(receiver, amount);

    ERC20UpgradeSafe token = ERC20UpgradeSafe(address(_exchangeToken));

    uint256 exchangeTokenAmount = this.amountExchangeTokenProvided(amount);
    token.increaseAllowance(receiver, exchangeTokenAmount);
  }

  function amountExchangeTokenProvided(uint256 amount) external override view returns (uint256) {
    return amount.exchangeTokenProvided(_exchangeRate);
  }

  uint256[50] private ______gap;
}

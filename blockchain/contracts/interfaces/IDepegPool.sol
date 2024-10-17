interface IDepegPool {
    function splitToken(uint256 _amount) external;
    function unSplitToken(uint256 _amount) external;
    function checkPoolIsActive() external view returns(bool);
    function redeemTokens(uint256 _amountYB, uint256 _amountDP) external;
    function resolvePriceDepeg() external;
}

interface IDepegPool {
    function splitToken(uint256 _amount) external;
    function unSplitToken(uint256 _amount) external;
    function checkPoolIsActive() external view returns(bool);
}
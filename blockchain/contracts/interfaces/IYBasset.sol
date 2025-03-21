import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IYBasset is IERC20 {
    function mint(address _account, uint256 _value) external;
    function burn(address _account, uint256 _value) external;
}

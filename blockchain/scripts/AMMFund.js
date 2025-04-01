const { ethers } = require("hardhat");
const depegPool = require("../ignition/modules/DepegPool");


async function main() {
    // Replace with your contract address and the private key
    const contractAddress = "0xCA6cede6771Ca07D8D55C1e6040438a9034E37A8";
    const privateKey = process.env.ACCOUNT_PRIVATE_KEY;
    // Define provider and signer
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_URL); // replace with actual network if needed
    const wallet = new ethers.Wallet(privateKey, provider);

    // Get contract ABI and initialize contract instance
    const abi = [
        "function addLiquidity(uint256[2] amounts, uint256 minShares) public"
    ];
    const contract = new ethers.Contract(contractAddress, abi, wallet);

    // Set the parameters
    const amounts = [ethers.parseEther("500"), ethers.parseEther("500")]; // Adjust units as per your token decimals
    const minShares = 0; // Integer for minShares

    // Call the function
    try {
        const tx = await contract.addLiquidity(amounts, minShares);
        console.log("Transaction successful:", tx.hash);
    } catch (error) {
        console.error("Transaction failed:", error);
    }
}

async function setLPoolContracts(Tpool, tETH, wTETH) {
    const provider = new ethers.JsonRpcProvider(process.env.BSC_URL); // replace with actual network if needed
    const abi = [
        "function setContract(address _contractTETH, address _contractWtETH) external"
    ];
    const privateKey = process.env.ACCOUNT_PRIVATE_KEY;
    const wallet = new ethers.Wallet(privateKey, provider);

    const contract = new ethers.Contract(Tpool, abi, wallet);
    // Call the function
    try {
        const tx = await contract.setContract(tETH, wTETH);
        console.log("Transaction successful:", tx.hash);
    } catch (error) {
        console.error("Transaction failed:", error);
    }

}

async function deployDepeg(
    managerContractAddress,
    Tpool,
    assets,
    yb_name,
    yb_symbol,
    dp_name,
    dp_symbol,
    pool_name,
    poolActiveDuration,
    flag
) {
    const provider = new ethers.JsonRpcProvider(process.env.BSC_URL); // replace with actual network if needed
    const abi = [
        "function deployDepeg(\n" +
        "        address _tPool,\n" +
        "        address _asset,\n" +
        "        string memory _yb_name,\n" +
        "        string memory _yb_symbol,\n" +
        "        string memory _dp_name,\n" +
        "        string memory _dp_symbol,\n" +
        "        string memory _pool_name,\n" +
        "        uint256 _poolActiveDuration,\n" +
        "        string memory flag\n" +
        "    ) external"
    ];
    const privateKey = process.env.ACCOUNT_PRIVATE_KEY;
    const wallet = new ethers.Wallet(privateKey, provider);

    const contract = new ethers.Contract(managerContractAddress, abi, wallet);
    // Call the function
    try {
        const tx = await contract.deployDepeg(
            Tpool,
            assets,
            yb_name,
            yb_symbol,
            dp_name,
            dp_symbol,
            pool_name,
            poolActiveDuration,
            flag
        );
        console.log("Transaction successful:", tx.hash);
    } catch (error) {
        console.error("Transaction failed:", error);
    }

}

async function getDepegContracts(managerContractAddress, index) {
    const provider = new ethers.JsonRpcProvider(process.env.BSC_URL); // replace with actual network if needed
    const abi = [
        "function depegModule(uint256 index) external view returns (address, address, address, address)"
    ];
    const privateKey = process.env.ACCOUNT_PRIVATE_KEY;
    const wallet = new ethers.Wallet(privateKey, provider);

    const contract = new ethers.Contract(managerContractAddress, abi, wallet);

    console.log(await contract.depegModule(0));
}

// setLPoolContracts(
//     "0xcfFEdb8E09a7029ae3181c93541000823A366337",
//     "0x6d87012eF7De41aC25D24a1962bB2Cb6E70879E9",
//     "0x46991C7b9Cc23561F513dF5d8bd5045B37c51AC6").catch((error) => {
//     console.error(error);
//     process.exit(1);
// })

// deployDepeg(
//     "0xd60165ca3a32ed5c1f14cdb2d70d72eeee55a006",
//     "0xcfFEdb8E09a7029ae3181c93541000823A366337",
//     "0x46991C7b9Cc23561F513dF5d8bd5045B37c51AC6",
//     "test YB",
//     "test YB",
//     "test DP",
//     "test DP",
//     "TEST POOL",
//     31536000,
//     "test"
// )

// main().catch((error) => {
//     console.error(error);
//     process.exitCode = 1;
// });

getDepegContracts("0xd60165ca3a32ed5c1f14cdb2d70d72eeee55a006", 0).catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

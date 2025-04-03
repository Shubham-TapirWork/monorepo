const { ethers } = require("hardhat");
const depegPool = require("../ignition/modules/DepegPool");


async function main() {
    // Replace with your contract address and the private key
    const contractAddress = "0xB0A642052B8AE98408dB754608a286F1B82B20C1";
    const privateKey = process.env.ACCOUNT_PRIVATE_KEY;
    // Define provider and signer
    const provider = new ethers.JsonRpcProvider(process.env.BSC_URL); // replace with actual network if needed
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

async function getFreewtETHForFunding(TpoolAddress) {
    const provider = new ethers.JsonRpcProvider(process.env.BSC_URL); // replace with actual network if needed
    const abi = [
        "function depositWithoutETH(uint256 _amount) external payable returns (uint256)"
    ];
    const privateKey = process.env.ACCOUNT_PRIVATE_KEY;
    const wallet = new ethers.Wallet(privateKey, provider);

    const contract = new ethers.Contract(TpoolAddress, abi, wallet);
    // Call the function
    try {
        const amount = ethers.parseEther("1000"); // Adjust units as per your token decimals
        const tx = await contract.depositWithoutETH(amount);
        console.log("Transaction successful:", tx.hash);
    } catch (error) {
        console.error("Transaction failed:", error);
    }
}

async function balanceOf(contractAddress, recipientAddress) {
    const provider = new ethers.JsonRpcProvider(process.env.BSC_URL); // replace with actual network if needed
    const abi = [
        "function balanceOf(address _user) external view returns (uint256)"
    ];
    const privateKey = process.env.ACCOUNT_PRIVATE_KEY;
    const wallet = new ethers.Wallet(privateKey, provider);

    const contract = new ethers.Contract(contractAddress, abi, wallet);

    console.log(await contract.balanceOf(recipientAddress));
}

async function approve(contractAddress, to) {
    const provider = new ethers.JsonRpcProvider(process.env.BSC_URL); // replace with actual network if needed
    const abi = [
        "function approve(address _spender, uint256 _amount) external returns (bool)"
    ];
    const privateKey = process.env.ACCOUNT_PRIVATE_KEY;
    const wallet = new ethers.Wallet(privateKey, provider);

    const contract = new ethers.Contract(contractAddress, abi, wallet);
    // Call the function
    try {
        const amount = ethers.parseEther("1000"); // Adjust units as per your token decimals
        const tx = await contract.approve(to, amount);
        console.log("Transaction successful:", tx.hash);
    } catch (error) {
        console.error("Transaction failed:", error);
    }
}

async function wrap(contractAddress) {
    const provider = new ethers.JsonRpcProvider(process.env.BSC_URL); // replace with actual network if needed
    const abi = [
        "function wrap(uint256 _tETHAmount) external returns (uint256)"
    ];
    const privateKey = process.env.ACCOUNT_PRIVATE_KEY;
    const wallet = new ethers.Wallet(privateKey, provider);

    const contract = new ethers.Contract(contractAddress, abi, wallet);
    // Call the function
    try {
        const amount = ethers.parseEther("1000"); // Adjust units as per your token decimals
        const tx = await contract.wrap(amount);
        console.log("Transaction successful:", tx.hash);
    } catch (error) {
        console.error("Transaction failed:", error);
    }
}

async function splitToken(contractAddress) {
    const provider = new ethers.JsonRpcProvider(process.env.BSC_URL); // replace with actual network if needed
    const abi = [
        "function splitToken(uint256 _amount) external"
    ];
    const privateKey = process.env.ACCOUNT_PRIVATE_KEY;
    const wallet = new ethers.Wallet(privateKey, provider);

    const contract = new ethers.Contract(contractAddress, abi, wallet);
    // Call the function
    try {
        const amount = ethers.parseEther("1000"); // Adjust units as per your token decimals
        const tx = await contract.splitToken(amount);
        console.log("Transaction successful:", tx.hash);
    } catch (error) {
        console.error("Transaction failed:", error);
    }
}

async function getDPassetForETH(contractAddress) {
    const provider = new ethers.JsonRpcProvider(process.env.BSC_URL); // replace with actual network if needed
    const abi = [
        "function getDPassetForETH(\n" +
        "        address _depegPoolAddress,\n" +
        "        address _stableSwap,\n" +
        "        address _ybAddress,\n" +
        "        address _dpAddress\n" +
        "    ) external"
    ];
    const privateKey = process.env.ACCOUNT_PRIVATE_KEY;
    const wallet = new ethers.Wallet(privateKey, provider);

    const contract = new ethers.Contract(contractAddress, abi, wallet);
    // Call the function
    try {
        const amount = ethers.parseEther("1000"); // Adjust units as per your token decimals
        const tx = await contract.getDPassetForETH(
            "0x0968508cDAf83169a67dCc5c59e5c1514B177b47",
            "0xB0A642052B8AE98408dB754608a286F1B82B20C1",
            "0x49568A57705c9EafD7336C6988264145F516f66c",
            "0x8E0c10e911bde2BB51fdAf6c966A0192b71Ed802",
            {value: ethers.parseEther("0.1")}
        );
        console.log("Transaction successful:", tx.hash);
    } catch (error) {
        console.error("Transaction failed:", error);
    }
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

// getDepegContracts("0xd60165ca3a32ed5c1f14cdb2d70d72eeee55a006", 0).catch((error) => {
//     console.error(error);
//     process.exitCode = 1;
// });

// getFreewtETHForFunding("0xcfFEdb8E09a7029ae3181c93541000823A366337").catch((error) => {
//     console.error(error);
//     process.exitCode = 1;
// })


// balanceOf( "0x6d87012eF7De41aC25D24a1962bB2Cb6E70879E9", "0xBf3F50076B12bFd3E379a18569861a8102eB8621").catch((error) => {
//     console.error(error);
//     process.exitCode = 1;
// });

// approve("0x6d87012eF7De41aC25D24a1962bB2Cb6E70879E9", "0x46991C7b9Cc23561F513dF5d8bd5045B37c51AC6").catch((err) => {
//     console.error("Transaction failed:", err);
//     process.exitCode = 1;
// })

// wrap("0x46991C7b9Cc23561F513dF5d8bd5045B37c51AC6").catch((err) => {
//     console.error("Transaction failed:", err);
//     process.exitCode = 1;
// });


// approve("0x46991C7b9Cc23561F513dF5d8bd5045B37c51AC6", "0x0968508cDAf83169a67dCc5c59e5c1514B177b47").catch((err) => {
//     console.error("Transaction failed:", err);
//     process.exitCode = 1;
// })

// splitToken("0x0968508cDAf83169a67dCc5c59e5c1514B177b47").catch((error) => {
//     console.error("Transaction failed:", error);
//     process.exitCode = 1;
// });

// approve("0x8e0c10e911bde2bb51fdaf6c966a0192b71ed802", "0xB0A642052B8AE98408dB754608a286F1B82B20C1").catch((err) => {
//     console.error("Transaction failed:", err);
//     process.exitCode = 1;
// })

// approve("0x49568a57705c9eafd7336c6988264145f516f66c", "0xB0A642052B8AE98408dB754608a286F1B82B20C1").catch((err) => {
//     console.error("Transaction failed:", err);
//     process.exitCode = 1;
// })

getDPassetForETH("0xcfFEdb8E09a7029ae3181c93541000823A366337").catch((error) => {
    console.error("Transaction failed:", error);
    process.exitCode = 1;
});

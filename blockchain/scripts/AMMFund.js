const { ethers } = require("hardhat");


async function main() {
    // Replace with your contract address and the private key
    const contractAddress = "0xF98F2a42264B6e98C8B9F30079e0b43dc0D3CE74";
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
    const amounts = [ethers.parseEther("50"), ethers.parseEther("50")]; // Adjust units as per your token decimals
    const minShares = 0; // Integer for minShares

    // Call the function
    try {
        const tx = await contract.addLiquidity(amounts, minShares);
        console.log("Transaction successful:", tx.hash);
    } catch (error) {
        console.error("Transaction failed:", error);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

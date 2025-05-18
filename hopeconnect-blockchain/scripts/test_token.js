const HopeToken = artifacts.require("HopeToken");

module.exports = async function (callback) {
  try {
    const token = await HopeToken.deployed();
    const accounts = await web3.eth.getAccounts();

    console.log("Accounts Loaded:");
    console.log(accounts);

    const MINTER_ROLE = await token.MINTER_ROLE();
    const BURNER_ROLE = await token.BURNER_ROLE();
    const ADMIN_ROLE = await token.DEFAULT_ADMIN_ROLE();

    // Grant roles
    await token.grantRole(MINTER_ROLE, accounts[0], { from: accounts[0] });
    await token.grantRole(BURNER_ROLE, accounts[0], { from: accounts[0] });
    await token.grantRole(ADMIN_ROLE, accounts[0], { from: accounts[0] });

    console.log("Roles granted to admin account.");

    // Mint tokens to account[1]
    await token.mint(accounts[1], web3.utils.toWei("100", "ether"), { from: accounts[0] });
    console.log("Minted 100 HOPE tokens to accounts[1]");

    // Burn tokens
    await token.burnForRedemption(accounts[1], web3.utils.toWei("10", "ether"), { from: accounts[0] });
    console.log("Burned 10 HOPE tokens from accounts[1]");

    // Check final balance
    const balance = await token.balanceOf(accounts[1]);
    console.log("Final Balance of accounts[1]:", web3.utils.fromWei(balance.toString(), "ether"), "HOPE");

    callback();
  } catch (err) {
    console.error("Error during test script execution:", err);
    callback(err);
  }
};

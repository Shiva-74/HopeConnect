const HopeToken = artifacts.require("HopeToken");

module.exports = async function (callback) {
  try {
    const token = await HopeToken.deployed();
    const accounts = await web3.eth.getAccounts();

    for (let i = 0; i < 5; i++) {
      const balance = await token.balanceOf(accounts[i]);
      console.log(`Account ${i} (${accounts[i]}) has ${web3.utils.fromWei(balance.toString(), 'ether')} HOPE tokens`);
    }

    callback();
  } catch (err) {
    console.error("Error fetching balances:", err);
    callback(err);
  }
};

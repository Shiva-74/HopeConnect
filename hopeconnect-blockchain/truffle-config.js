// C:\Users\tejas\HopeConnect\hopeconnect-blockchain\truffle-config.js
module.exports = {
  networks: {                // Line 2
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*",
    },                       // Line 7
  },                         // Line 8
  mocha: {                    // Line 9
    // timeout: 100000
  },                         // Line 11
  compilers: {                // Line 12
    solc: {
      version: "0.8.17",
      settings: {             // Line 15
        optimizer: {
          enabled: true,
          runs: 200
        },                    // Line 19 - Comma needed here if viaIR follows
        viaIR: true
      }                       // Line 21 - Closing 'settings'
    }                         // Line 22 - Closing 'solc'
  }                           // Line 23 - Closing 'compilers'  <-- ERROR LIKELY HERE OR BEFORE
};                            // Line 24 - Closing 'module.exports'
const { v4: uuidv4 } = require('uuid'); // You might need to install uuid: npm install uuid

const generateDID = (type) => {
    const uniqueId = uuidv4();
    return `did:hope:${type}:${uniqueId}`;
};

module.exports = { generateDID };
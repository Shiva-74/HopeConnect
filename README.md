# Hopeconnect
HopeConnect: Decentralized, AI-Powered Organ Donation Matching & Transparency Platform

*Connecting Last Hopes With New Beginnings*

HopeConnect is a *blockchain-powered, **AI-driven* platform that transforms India’s organ donation ecosystem by enabling *secure, transparent, and real-time matching* of donors and recipients.

Over *300,000 patients* in India await transplants, yet *20+ lives are lost daily* due to outdated systems, poor logistics, and lack of trust. HopeConnect bridges this life-threatening gap through Ethereum smart contracts, predictive AI models, and automated logistics coordination.

---

## 🚀 Key Features

### 🔗 Blockchain-Powered Consent & Transparency
- Immutable, *tamper-proof records* of donor consent and organ lifecycle on *Ethereum*.
- *Smart contracts* automate access control, priority enforcement, and audit trails.
  
### 🧠 AI-Optimized Matching Engine
- Matches beyond blood types — considers *age, comorbidities, distance, viability*.
- Uses *ML models* to predict *graft survival success* and suggest optimal recipient.

### 📦 Real-Time Logistics & Automation
- Calculates *fastest delivery routes* via road/air considering traffic and customs delays.
- Generates permits and *cold-chain documents* via integrated APIs.

### 📊 Stakeholder Portals
- *Hospitals:* AI-ranked recipient list, organ ETA, viability scores.
- *Regulators/NGOs:* Real-time compliance, fairness metrics, and chain-of-custody logs.
- *Donor Families:* Receive impact updates — e.g., “Your gift saved 3 lives.”

### 🎁 Incentivization via HopeTokens
- Donors and families receive *HopeTokens* redeemable for:
  - 🎟 Health checkups  
  - 🛡 Insurance perks  
  - 💸 Tax benefits

### 📢 Awareness & Sign-Up Drives
- In-app awareness campaigns to boost *public registrations* and *reduce stigma* around donation.

---

## 🛠 Tech Stack

*Blockchain:* Ethereum, Solidity, Truffle, Ganache, Web3.js  
*AI/ML:* Python, Scikit-learn, XGBoost, Pandas, Flask, Geopy  
*Backend/API:* Node.js, Express.js, MongoDB, Postman  
*Frontend:* React.js

---

## 💡 How It Works

1. Donor consents recorded via *smart contracts*.
2. Organ offer triggers *AI model* to rank eligible recipients.
3. Smart contract validates access, initiates automated logistics.
4. Hospitals and authorities coordinate via live dashboard.
5. Donor families are updated via secure app & rewarded via *HopeTokens*.

---



## System Requirements

- Python 3.12.x

- Node.js (with npm)  

- MongoDB Community Server  

- Ganache (Truffle Suite)  

- Truffle Suite  



## Installation Links

- [Python 3.x](https://www.python.org/downloads/) – Official Python downloads page.  

- [Node.js (with npm)](https://nodejs.org/en/download/) – Official Node.js download page.  

- [MongoDB Community Edition](https://www.mongodb.com/try/download/community) – Download MongoDB Community Server.  

- [Ganache (Truffle Suite)](https://www.trufflesuite.com/ganache) – Ethereum blockchain emulator.  

- [Truffle Suite](https://www.trufflesuite.com/truffle) – Ethereum development framework.  



## Installation and Setup


# Clone repository
```
git clone https://github.com/Shiva-74/HopeConnect.git
```
## Move to hopeconnect directory
```
cd hopeconnect
```

# Now go to hopeconnect-blockchain directory 
1. *Start Ganache:* Open the Ganache application and click *Quickstart (Ethereum)* to launch a local blockchain network and install dependencies.  

2. *Deploy Smart Contracts:* In a terminal, navigate to the project’s blockchain directory and compile/deploy the contracts:  
```
cd blockchain
npm install
npm install -g ganache
npm install -g truffle
npm install --save-dev ganache
npm install @openzeppelin/contracts@4.9.6 --save
```

### Run the blockchain
```
truffle compile --all
truffle migrate --reset
```
you can see it on ganache gui and terminal

# Now go to hopeconnect- ai directory in a new terminal
```
cd hopeconnect
cd hopeconnect-ai
```

## Start a virtual environment
```
python -m venv venv
venv\Scripts\activate
```

### Install all the dependencies and requirements.txt
```
pip install -r requirements.txt
```
### Run the app.py
```
python src/app.py
```
You will see that it is running in locahost

# Now go to hopeconnect-backend in a new terminal
```
cd hopeconnect
cd hopeconnect-backend
```

### Install all the requirements
```
pip install -r requirements.txt
```
### Run the backend
```
npm run dev
```
Now you will see the backend is running

# Now go to hopeconnect-frontend directory in a new terminal
```
cd hopeconnect
cd hopeconnect-frontend
```
### Start the frontend app
```
set NODE_OPTIONS=--openssl-legacy-provider
npm start
```
## License

HopeConnect is released under the MIT License. See the [LICENSE](LICENSE) file for details.





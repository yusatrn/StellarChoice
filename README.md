# StellarChoice

A decentralized voting application built on the Stellar blockchain, enabling secure, transparent, and tamper-proof voting for communities and organizations.

![StellarChoice Banner](https://via.placeholder.com/1200x400/1e293b/ffffff?text=StellarChoice+Voting+Platform)

## 🌟 Features

- 🔐 **Secure Authentication**
  - Connect with Freighter wallet (Stellar's official wallet)
  - End-to-end encrypted transactions
  - Non-custodial solution - users control their keys

- 🗳️ **Voting System**
  - Create and participate in polls
  - Real-time vote counting
  - Transparent and auditable results
  - One vote per verified wallet address

- 🚀 **User Experience**
  - Modern, responsive interface
  - Real-time updates
  - Transaction status tracking
  - Mobile-friendly design

- 🔗 **Blockchain Integration**
  - Built on Stellar blockchain
  - Smart contract powered
  - Fast and low-cost transactions
  - Transparent and immutable records

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [npm](https://www.npmjs.com/) or [Yarn](https://yarnpkg.com/)
- [Freighter Wallet](https://www.freighter.app/) (Browser extension)
- Basic knowledge of Stellar blockchain

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yusatrn/StellarChoice.git
   cd StellarChoice
   ```

2. **Install dependencies**
   ```bash
   cd frontend
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the `frontend` directory with:
   ```env
   NEXT_PUBLIC_STELLAR_NETWORK=TESTNET  # or PUBLIC for mainnet
   NEXT_PUBLIC_CONTRACT_ID=YOUR_CONTRACT_ID
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**
   Visit [http://localhost:3000](http://localhost:3000)

## 📱 Using the Application

1. **Connect Your Wallet**
   - Click "Connect Wallet"
   - Authorize with Freighter
   - Approve the connection

2. **Voting**
   - Browse available polls
   - Select your preferred option
   - Confirm the transaction
   - View real-time results

3. **Creating Polls** (Admin)
   - Navigate to "Create Poll"
   - Fill in poll details
   - Set start/end times
   - Deploy the poll

## 🛠️ Project Structure

```
frontend/
├── app/                    # Next.js app directory
│   ├── components/         # Reusable UI components
│   ├── contexts/           # React contexts
│   ├── lib/                # Utility functions
│   └── styles/             # Global styles
├── public/                 # Static files
├── contracts/              # Smart contracts
└── tests/                  # Test files
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support, please open an issue in the GitHub repository.

## 🙏 Acknowledgments

- Stellar Development Foundation
- Freighter Wallet Team
- All contributors and testers

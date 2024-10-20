import React, { useState, useEffect, useMemo, ErrorInfo } from 'react';
import { Menu, X, Twitter, MessageCircle } from 'lucide-react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import StakingComponent from './components/StakingComponent';

// Default styles that can be overridden by your app
import '@solana/wallet-adapter-react-ui/styles.css';

// Error boundary component
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong. Please check the console for more information.</h1>;
    }

    return this.props.children;
  }
}

function App() {
  console.log("App component rendering");

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 15, hours: 0, minutes: 0, seconds: 0 });
  const [followers, setFollowers] = useState(0);
  const [currentPage, setCurrentPage] = useState('home');
  const [carouselPosition, setCarouselPosition] = useState(0);

  // You can also provide a custom RPC endpoint
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  // @solana/wallet-adapter-wallets includes all the adapters but supports tree shaking and lazy loading --
  // Only the wallets you configure here will be compiled into your application, and only the dependencies
  // of wallets that your users connect to will be loaded
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
    ],
    []
  );

  useEffect(() => {
    console.log("App useEffect running");
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const targetDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });

      if (difference < 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Simulate follower count increase
  useEffect(() => {
    const interval = setInterval(() => {
      setFollowers(prev => Math.min(prev + Math.floor(Math.random() * 10), 5000));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCarouselPosition((prev) => (prev + 1) % 500);
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const renderHomePage = () => (
    <main className="flex-grow pt-24">
      <div className="w-full bg-white h-64 mb-12"></div>
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex flex-col items-center mb-12">
          <h2 className="text-6xl font-bold mb-8 text-center text-yellow-400">
            Art Reveal:
          </h2>
          <div className="flex justify-center space-x-4 mb-4">
            {Object.entries(timeLeft).map(([unit, value]) => (
              <div key={unit} className="text-center">
                <div className="bg-yellow-400 text-gray-900 text-4xl font-bold p-4 rounded-lg w-24">
                  <span className="countdown-number">{value.toString().padStart(2, '0')}</span>
                </div>
                <div className="text-sm mt-2 uppercase">{unit}</div>
              </div>
            ))}
          </div>
          <div className="text-center mb-8">
            <p className="text-4xl mb-2">or</p>
            <div className="flex items-center justify-center space-x-2 text-3xl font-bold">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                <Twitter className="w-8 h-8" />
              </a>
              <span>followers: {followers}/5000</span>
            </div>
          </div>
        </div>
        <div className="space-y-6 px-4 sm:px-6 lg:px-8 border-2 border-gray-700 rounded-lg p-6">
          <p>
            Welcome to Money Loving Monkeys, the most bananas NFT project in the crypto jungle! Our collection features 10,000 unique, algorithmically generated primates with a passion for finance.
          </p>
          <p>
            Each Money Loving Monkey is your ticket to exclusive benefits in our ecosystem, from our banana-backed DeFi platform to DAO voting rights.
          </p>
          <div className="w-full h-64 bg-white mb-6"></div>
          <p>
            Get ready for our big reveal and join our community. In the jungle of NFTs, it's not just about monkey business – it's about monkey finance!
          </p>
        </div>
        <div className="mt-12">
          <h3 className="text-3xl font-bold mb-4 text-center">Our partners:</h3>
          <div className="relative h-40 overflow-hidden">
            <div 
              className="absolute flex space-x-4 transition-transform duration-1000 ease-linear"
              style={{ transform: `translateX(-${carouselPosition}px)` }}
            >
              {[...Array(10)].map((_, i) => (
                <div key={i} className="w-40 h-40 bg-gray-500 flex-shrink-0"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );

  console.log("App about to return JSX");

  return (
    <ErrorBoundary>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <div className="min-h-screen flex flex-col bg-gray-900 text-white">
              <header
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${
                  isScrolled ? 'bg-gray-900/70 backdrop-blur-md h-16' : 'bg-gray-900 h-24'
                }`}
              >
                <div className="container mx-auto px-4 h-full flex items-center justify-between">
                  <h1 className={`font-bold transition-all duration-300 ease-in-out ${
                    isScrolled ? 'text-xl' : 'text-3xl'
                  } text-yellow-400`}>
                    Money Loving Monkeys
                  </h1>
                  <div className="flex items-center">
                    <div className="mr-4 w-8 h-8 bg-blue-500 rounded-full transition-transform duration-300 hover:scale-110"></div>
                    <nav className="hidden md:block">
                      <ul className="flex space-x-4">
                        <li><a href="/" className="text-gray-300 hover:text-white">Home</a></li>
                        <li><a href="#" onClick={() => setCurrentPage('miner')} className="text-gray-300 hover:text-white">Miner</a></li>
                      </ul>
                    </nav>
                    <button
                      className="md:hidden bg-yellow-400 text-gray-900 p-2 rounded"
                      onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                      {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                      <span className="sr-only">Toggle menu</span>
                    </button>
                  </div>
                </div>
                {isMenuOpen && (
                  <div className="md:hidden fixed inset-0 z-40 bg-gray-900/70 backdrop-blur-md">
                    <nav className="container mx-auto px-4 pt-24">
                      <ul className="space-y-4">
                        <li><a href="/" className="block text-2xl text-gray-300 hover:text-white py-2">Home</a></li>
                        <li><a href="#" onClick={() => { setCurrentPage('miner'); setIsMenuOpen(false); }} className="block text-2xl text-gray-300 hover:text-white py-2">Miner</a></li>
                      </ul>
                    </nav>
                  </div>
                )}
              </header>
              {currentPage === 'home' ? renderHomePage() : <StakingComponent />}
              <footer className="bg-gray-800 py-8 mt-12">
                <div className="container mx-auto px-4 flex justify-center space-x-8">
                  <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                    <Twitter className="w-8 h-8" />
                  </a>
                  <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300">
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                    </svg>
                  </a>
                  <a href="https://telegram.org" target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:text-sky-300">
                    <MessageCircle className="w-8 h-8" />
                  </a>
                </div>
              </footer>
            </div>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </ErrorBoundary>
  );
}

export default App;
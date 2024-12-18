'use client';

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import Header from '../../components/custom/header';
import Footer from '../../components/custom/footer';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import EventManagerABI from '../../contracts/EventManagerABI.json';

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL;
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

if (!RPC_URL || !CONTRACT_ADDRESS) {
  console.error(
    'Missing environment variables. Please check your .env.local file.'
  );
}

interface TicketDetails {
  ticketId: number;
  eventName: string;
  eventLocation: string;
  eventDate: string;
  imageUrl: string;
}

export default function Component() {
  const [isClient, setIsClient] = useState(false);
  const [userTickets, setUserTickets] = useState<TicketDetails[]>([]);
  const [userAddress, setUserAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [networkName, setNetworkName] = useState('');

  useEffect(() => {
    setIsClient(true);
    checkNetwork();
  }, []);

  const checkNetwork = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const network = await provider.getNetwork();
        console.log('Network:', network);
        setNetworkName(network.name);
      } catch (error) {
        console.error('Failed to get network:', error);
      }
    }
  };

  const connectWallet = async () => {
    setLoading(true);
    setError('');
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        setUserAddress(address);
        await fetchUserTickets(address);
      } catch (error) {
        console.error('Failed to connect wallet:', error);
        setError('Failed to connect wallet. Please try again.');
      }
    } else {
      setError('Please install MetaMask!');
    }
    setLoading(false);
  };

  const fetchUserTickets = async (address: string) => {
    try {
      const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS!,
        EventManagerABI,
        provider
      );

      const ticketIds = await contract.getUserTickets(address);
      console.log('Raw tickets data:', ticketIds);

      const ticketDetailsPromises = ticketIds.map(
        async (ticketId: ethers.BigNumber) => {
          const ticketNumber = ticketId.toNumber();
          const ticket = await contract.tickets(ticketNumber);
          const event = await contract.events(ticket.eventId);

          console.log(`Ticket ${ticketNumber} data:`, ticket);
          console.log(`Event ${ticket.eventId} data:`, event);

          // Process event data to ensure it has all necessary fields
          const eventDate = new Date(event.eventStartDate.toNumber() * 1000);
          return {
            ticketId: ticketNumber,
            eventName: event.name || 'Unnamed Event',
            eventLocation: event.location || 'No location specified',
            eventDate: eventDate.toISOString().split('T')[0],
            imageUrl:
              event.images && event.images.length > 0
                ? event.images[0]
                : 'https://via.placeholder.com/150',
          };
        }
      );

      const details = (await Promise.all(ticketDetailsPromises)).filter(
        Boolean
      );
      setUserTickets(details);
    } catch (error) {
      console.error('Failed to fetch user tickets:', error);
      // @ts-ignore
      setError(`Failed to fetch user tickets: ${error.message}`);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      <Header />
      <div className="absolute inset-0">
        {isClient && (
          <video
            autoPlay
            loop
            muted
            className="absolute inset-0 w-full h-full object-cover z-0"
            src="/BGVid3.mp4"
          >
            Your browser does not support the video tag.
          </video>
        )}
        <div className="absolute inset-0 bg-black opacity-50 z-10"></div>
      </div>
      <div className="relative z-20 container mx-auto p-4 pt-16">
        <div className="relative text-white">
          <h1 className="text-4xl font-bold mb-4">Your Profile</h1>
          {userAddress ? (
            <p className="mb-4">Connected Address: {userAddress}</p>
          ) : (
            <p className="mb-4">Not connected</p>
          )}

          {error && (
            <div className="bg-red-500 text-white p-2 rounded mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userTickets.length > 0 ? (
                userTickets.map((details) => (
                  <Card
                    key={details.ticketId}
                    className="bg-gray-800 text-white"
                  >
                    <CardHeader>
                      <img
                        src={details.imageUrl}
                        alt={details.eventName}
                        className="w-full h-36 object-cover rounded-t-lg"
                      />
                      <CardTitle>{details.eventName}</CardTitle>
                      <CardDescription>{details.eventLocation}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p>Ticket ID: {details.ticketId}</p>
                      <p>Date: {details.eventDate}</p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p>You don&apos;t have any tickets yet.</p>
              )}
            </div>
          )}

          <Button className="mt-4" onClick={connectWallet} disabled={loading}>
            {loading
              ? 'Connecting...'
              : userAddress
                ? 'Refresh Tickets'
                : 'Connect Wallet'}
          </Button>
        </div>
      </div>
      <Footer />
    </div>
  );
}

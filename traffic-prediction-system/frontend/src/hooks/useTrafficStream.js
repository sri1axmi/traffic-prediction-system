import { useState, useEffect } from 'react';

export const useTrafficStream = () => {
    const [liveTrafficData, setLiveTrafficData] = useState([]);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Connect to the WebSocket API
        const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/api/ws/traffic';
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log('Connected to Live Traffic Stream');
            setIsConnected(true);
        };

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.type === 'LIVE_TRAFFIC_UPDATE') {
                    setLiveTrafficData(message.data);
                }
            } catch (error) {
                console.error('Error parsing live traffic data', error);
            }
        };

        ws.onclose = () => {
            console.log('Disconnected from Live Traffic Stream');
            setIsConnected(false);
        };

        return () => {
            ws.close();
        };
    }, []);

    return { liveTrafficData, isConnected };
};

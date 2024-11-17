import React from 'react';
import { socket } from '../lib/socket';

export function TestControls() {
  const [testUserId, setTestUserId] = React.useState('');

  const toggleLiveStatus = () => {
    const isLive = Math.random() > 0.5;
    console.log('Emitting statusUpdate:', { userId: testUserId, isLive });
    
    socket.emit('statusUpdate', {
      userId: testUserId,
      isLive
    });
  };

  React.useEffect(() => {
    console.log('TestControls mounted');
    return () => console.log('TestControls unmounted');
  }, []);

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-50">
      <input
        type="text"
        value={testUserId}
        onChange={(e) => setTestUserId(e.target.value)}
        placeholder="Enter user ID"
        className="mb-2 px-2 py-1 border rounded"
      />
      <button
        onClick={toggleLiveStatus}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Toggle Live Status
      </button>
    </div>
  );
}

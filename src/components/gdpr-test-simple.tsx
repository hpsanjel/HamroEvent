import { useState } from "react";

export default function GDPRTestSimple() {
  const [showTest, setShowTest] = useState(true);

  return (
    <div className="fixed top-20 right-4 z-[9999] bg-red-500 text-white p-4 rounded-lg shadow-xl">
      <h3 className="font-bold mb-2">GDPR Components Test</h3>
      <p className="text-sm mb-3">If you can see this, the app is rendering!</p>
      <button 
        onClick={() => setShowTest(!showTest)}
        className="bg-white text-red-500 px-3 py-1 rounded text-sm"
      >
        {showTest ? 'Hide' : 'Show'}
      </button>
    </div>
  );
}

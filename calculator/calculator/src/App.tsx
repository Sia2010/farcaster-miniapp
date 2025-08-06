// import { sdk } from "@farcaster/frame-sdk";
// import { useEffect } from "react";
// import { useAccount, useConnect, useSignMessage } from "wagmi";

// function App() {
//   useEffect(() => {
//     sdk.actions.ready();
//   }, []);

//   return (
//     <>
//       <div>Mini App + Vite + TS + React + Wagmi</div>
//       <ConnectMenu />
//     </>
//   );
// }

// function ConnectMenu() {
//   const { isConnected, address } = useAccount();
//   const { connect, connectors } = useConnect();

//   if (isConnected) {
//     return (
//       <>
//         <div>Connected account:</div>
//         <div>{address}</div>
//         <SignButton />
//       </>
//     );
//   }

//   return (
//     <button type="button" onClick={() => connect({ connector: connectors[0] })}>
//       Connect
//     </button>
//   );
// }

// function SignButton() {
//   const { signMessage, isPending, data, error } = useSignMessage();

//   return (
//     <>
//       <button type="button" onClick={() => signMessage({ message: "hello world" })} disabled={isPending}>
//         {isPending ? "Signing..." : "Sign message"}
//       </button>
//       {data && (
//         <>
//           <div>Signature</div>
//           <div>{data}</div>
//         </>
//       )}
//       {error && (
//         <>
//           <div>Error</div>
//           <div>{error.message}</div>
//         </>
//       )}
//     </>
//   );
// }

// export default App;
// import React, { useState, useEffect } from 'react';
// import { sdk } from '@farcaster/miniapp-sdk';
// import './style.css';

// function App() {
//   const [display, setDisplay] = useState('0');
//   const [prev, setPrev] = useState<number | null>(null);
//   const [op, setOp] = useState<string | null>(null);

//   useEffect(() => {
//     sdk.actions.ready();
//   }, []);

//   const input = (x: string) => {
//     setDisplay((d) => (d === '0' ? x : d + x));
//   };

//   const chooseOp = (operator: string) => {
//     if (prev === null) {
//       setPrev(parseFloat(display));
//       setDisplay('0');
//     } else if (op) {
//       const result = compute();
//       setPrev(result);
//       setDisplay('0');
//     }
//     setOp(operator);
//   };

//   const compute = () => {
//     const current = parseFloat(display);
//     if (prev === null || op === null) return current;
//     let result = 0;
//     if (op === '+') result = prev + current;
//     if (op === '-') result = prev - current;
//     if (op === '*') result = prev * current;
//     if (op === '/') result = prev / current;
//     return result;
//   };

//   const equals = () => {
//     const result = compute();
//     setDisplay(String(result));
//     setPrev(null);
//     setOp(null);
//   };

//   const clear = () => {
//     setDisplay('0');
//     setPrev(null);
//     setOp(null);
//   };

//   return (
//     <div className="calculator">
//       <div className="display">{display}</div>
//       <div className="buttons">
//         <button onClick={clear} className="span-two">AC</button>
//         <button onClick={() => chooseOp('/')}>/</button>
//         <button onClick={() => chooseOp('*')}>*</button>
//         {[...Array(9)].map((_, i) => (
//           <button key={i} onClick={() => input(String(i + 1))}>{i + 1}</button>
//         ))}
//         <button onClick={() => chooseOp('-')}>-</button>
//         <button onClick={() => input('0')}>0</button>
//         <button onClick={() => chooseOp('+')}>+</button>
//         <button onClick={equals} className="span-two">=</button>
//       </div>
//     </div>
//   );
// }

// export default App;

import React, { useState, useEffect } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

export default function App() {
  const [display, setDisplay] = useState('0');
  const [prev, setPrev] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);

  useEffect(() => {
    sdk.actions.ready();
  }, []);

  const input = (x: string) => {
    setDisplay((d) => (d === '0' ? x : d + x));
  };

  const chooseOp = (operator: string) => {
    if (prev === null) {
      setPrev(parseFloat(display));
      setDisplay('0');
    } else if (op) {
      const result = compute();
      setPrev(result);
      setDisplay('0');
    }
    setOp(operator);
  };

  const compute = () => {
    const current = parseFloat(display);
    if (prev === null || op === null) return current;
    switch (op) {
      case '+': return prev + current;
      case '-': return prev - current;
      case '*': return prev * current;
      case '/': return prev / current;
      default: return current;
    }
  };

  const equals = () => {
    const result = compute();
    setDisplay(String(result));
    setPrev(null);
    setOp(null);
  };

  const clear = () => {
    setDisplay('0');
    setPrev(null);
    setOp(null);
  };

  const buttons = [
    { label: 'AC', action: clear, span: 2, style: 'bg-lightblue hover:bg-primary text-white' },
    { label: '/', action: () => chooseOp('/'), style: 'bg-accent hover:bg-darkblue text-white' },
    { label: '*', action: () => chooseOp('*'), style: 'bg-accent hover:bg-darkblue text-white' },
    ...Array.from({ length: 9 }, (_, i) => ({
      label: String(i + 1),
      action: () => input(String(i + 1)),
      style: 'bg-gray-100 hover:bg-gray-200 text-gray-800',
    })),
    { label: '-', action: () => chooseOp('-'), style: 'bg-accent hover:bg-darkblue text-white' },
    { label: '0', action: () => input('0'), style: 'bg-gray-100 hover:bg-gray-200 text-gray-800' },
    { label: '+', action: () => chooseOp('+'), style: 'bg-accent hover:bg-darkblue text-white' },
    { label: '=', action: equals, span: 2, style: 'bg-primary hover:bg-darkblue text-white' },
  ];

  return (
    <div className="flex items-center justify-center h-screen bg-bg">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-80">
        <div className="bg-darkblue text-white text-right text-4xl font-medium rounded-lg p-4 mb-4 overflow-x-auto">
          {display}
        </div>
        <div className="grid grid-cols-4 gap-4">
          {buttons.map((btn, idx) => (
            <button
              key={idx}
              onClick={btn.action}
              className={`
                ${btn.style} rounded-lg text-2xl py-4 
                ${btn.span === 2 ? 'col-span-2' : ''}`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

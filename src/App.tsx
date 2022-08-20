import React from 'react';
import './App.css';
import { floors } from './Data';

function App() {
  return (
    <div>
      {Object.entries(floors).map(([name, rooms]) => (
        <svg xmlns="http://www.w3.org/2000/svg"
             xmlnsXlink="http://www.w3.org/1999/xlink"
             viewBox="0 0 2993 2117"
             key={name}>
          <image
              width="2993" height="2117"
              xlinkHref={`${process.env.PUBLIC_URL}/images/${encodeURIComponent(name)}.png`}
              />
          {rooms.map(({ name, top, left, width, height }) => (<rect key={name} 
              y={top}
              x={left}
              width={width}
              height={height}
              style={{
                fill: 'yellow',
                fillOpacity: '0.3',
              }}
            />
        ))}
      </svg>))}
    </div>
  );
}

export default App;

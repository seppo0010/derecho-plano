import React from 'react';
import './App.css';
import { floors } from './Data';

function App() {
  return (
    <div>
      {Object.entries(floors).map(([name, rooms]) => (<div className="floor" key={name}>
        <img src={`${process.env.PUBLIC_URL}/images/${encodeURIComponent(name)}.png`} alt="" />
        {rooms.map(({ name, top, left, width, height }) => (<div key={name} className="room" style={{
            top,
            left,
            width,
            height,
          }}>
        </div>))}
      </div>))}
    </div>
  );
}

export default App;

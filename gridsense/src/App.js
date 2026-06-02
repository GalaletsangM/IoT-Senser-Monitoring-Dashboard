import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import './App.css';

//Sensor config -- my device registry
const SENSORS = [
  {id: 'voltage', label: 'Voltage', unit: 'V', base: 220, range: 10, warn: 235},
  {id: 'current', label: 'Current', unit: 'A', base: 15, range: 3, warn: 18},
  {id: 'temperature', label: 'Temperature', unit: '°C', base: 65, range: 8, warn: 75},
  {id: 'power', label: 'Power', unit: 'kW', base: 3.3, range: 0.5, warn: 4},
]

const MAX_HISTORY = 20; //number of data points the chart keeps

//Simulating a sensor reading with slight random drift
function generateReading(sensor) {
  const drift = (Math.random() - 0.5) * sensor.range;
  return parseFloat((sensor.base + drift).toFixed(2));
}

function SensorCard({sensor, value, prevValue}) {
  const isWarning = value >= sensor.warn;
  const diff = value - prevValue;
  const trend = Math.abs(diff) < 0.05 ? 'stable' : diff > 0 ? 'up' : 'down';
  const trendLabel =
    trend === "stable" ? "● Stable" : trend === "up" ? "▲ Rising" : "▼ Falling";

  return (
    <div className="card" style={{borderColor: isWarning ? '#ff6b6b50' : undefined}}>
      <div className="label">{sensor.label}</div>
      <div className="value">
        {value}
        <span className="unit">{sensor.unit}</span>
      </div>
      <div className={`trend ${trend}`}>{trendLabel}</div>
      {isWarning && (
        <div style={{marginTop: 10,  fontSize: '0.7rem', color: '#ff6b6b', background: '#2a0a0a', padding: '4px 10px', borderRadius: 6}}>
          ⚠️ Above threshold ({sensor.warn}{sensor.unit})
        </div>
      )}
    </div>
  );
}
//Custom tooltip that appears on hover
function CustomTooltip({ active, payload, unit }) {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: '#0d1525', border: '1px solid #1a2a40', 
        borderRadius: 8, padding: '8px 14px', fontSize: '0.78rem', color: '#c8d6e8'
      }}>
        <strong style={{color: '#00e5c8'}}>{payload[0].value} {unit}</strong>
      </div>
    );
  }
  return null;
}

function SensorChart({sensor, history}) {
  return (
    <div className="chart-card">
      <div className="label" style={{marginBottom: 12}}>{sensor.label} History</div>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={history}>
          <XAxis dataKey="t" hide />
          <YAxis
            domain={['auto', 'auto']}
            tick={{fill: '#4a6a8a', fontSize: 10}}
            width={36} 
          />
          <Tooltip content={<CustomTooltip unit={sensor.unit} />} />
          <ReferenceLine
            y={sensor.warn}
            stroke="#ff6b6b"
            strokeDasharray="4 4"
            label={{value: 'WARN', fill: '#ff6b6b', fontSize: 9}}
          />
          <Line type="monotone" dataKey="value" stroke="#00e5c8" strokeWidth={2} dot={false} isAnimationActive={false}/>
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
export default function App() {
  const [readings, setReadings] = useState(() =>
    Object.fromEntries(SENSORS.map(s => [s.id, generateReading(s)]))
  );
  const [prevReadings, setPrevReadings] = useState(readings);

  //history is an object:volatge: [{t, value}, ....], ...}
  const [history, setHistory] = useState(() =>
    Object.fromEntries(SENSORS.map(s => [s.id, []]))
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const newReadings = Object.fromEntries(
        SENSORS.map(s => [s.id, generateReading(s)])
      );
      const  timestamp = new Date().toLocaleTimeString();

      setPrevReadings(readings);
      setReadings(newReadings);

      //Append new reading to each sensor's history, keep last MAX_HISTORY points
      setHistory(prev => 
        Object.fromEntries(
          SENSORS.map(s => [
            s.id,
            [...prev[s.id], {t: timestamp, value: newReadings[s.id]}]
              .slice(-MAX_HISTORY)
          ])
        )
      );
    }, 2000); //updates every 2 seconds      
    return () => clearInterval(interval); //cleanup on unmount
  }, [readings]);

  return (
    <div className="app">
      <div className="header">
        <h1>⚡ GridSense</h1>
        <span className="status">● LIVE - updating every 2s </span>
      </div>

      <div className="cards-grid">
        {SENSORS.map(sensor => (
          <SensorCard
            key={sensor.id}
            sensor={sensor}
            value={readings[sensor.id]}
            prevValue={prevReadings[sensor.id]}
          />
        ))}
      </div>

      <div className="charts-grid">
        {SENSORS.map(sensor => (
          <SensorChart key={sensor.id} sensor={sensor} history={history[sensor.id]} />
        ))}
      </div>
    </div>
  );
}
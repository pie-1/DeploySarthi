import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const mockLatencyData = [
  { time: '00:00', latency: 180 }, { time: '03:00', latency: 175 },
  { time: '06:00', latency: 190 }, { time: '09:00', latency: 220 },
  { time: '12:00', latency: 260 }, { time: '15:00', latency: 240 },
  { time: '18:00', latency: 210 }, { time: '21:00', latency: 195 },
];

const mockCpuData = [
  { time: '00:00', cpu: 18 }, { time: '03:00', cpu: 15 },
  { time: '06:00', cpu: 22 }, { time: '09:00', cpu: 38 },
  { time: '12:00', cpu: 55 }, { time: '15:00', cpu: 48 },
  { time: '18:00', cpu: 32 }, { time: '21:00', cpu: 24 },
];

export const LatencyChart = ({ data = mockLatencyData }) => (
  <div className="bg-white border border-gray-200 rounded-2xl p-5">
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">API Latency</h3>
        <p className="text-xs text-gray-500 mt-0.5">Last 24 hours · ms</p>
      </div>
      <span className="text-xs font-mono font-semibold text-gray-700">
        avg {Math.round(data.reduce((s, d) => s + d.latency, 0) / data.length)}ms
      </span>
    </div>
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={40} />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
          labelStyle={{ color: '#6b7280', fontWeight: 600 }}
        />
        <Line type="monotone" dataKey="latency" stroke="#4F46E5" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

export const CpuChart = ({ data = mockCpuData }) => (
  <div className="bg-white border border-gray-200 rounded-2xl p-5">
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">CPU Usage</h3>
        <p className="text-xs text-gray-500 mt-0.5">Last 24 hours · %</p>
      </div>
      <span className="text-xs font-mono font-semibold text-gray-700">
        peak {Math.max(...data.map((d) => d.cpu))}%
      </span>
    </div>
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={40} />
        <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
        <Area type="monotone" dataKey="cpu" stroke="#10B981" strokeWidth={2} fill="url(#cpuGradient)" />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);
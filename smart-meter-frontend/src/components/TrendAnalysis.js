import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from "../services/api";
import {
  Zap,
  BarChart3,
  Lightbulb,
  Settings,
  Bell,
  User,
  TrendingUp,
  MessageCircle,
  Download
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area
} from 'recharts';
import './Dashboard.css';

const TrendAnalysis = () => {
  const [activeTab, setActiveTab] = useState('trend');
  const [showChatbot, setShowChatbot] = useState(false);
  const [consumptionTrends, setConsumptionTrends] = useState([]);
  const [aiPrediction, setAiPrediction] = useState({});
  const [insights, setInsights] = useState([]);
  const [historicalData, setHistoricalData] = useState([]);

  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3, path: '/dashboard' },
    { id: 'trend', label: 'Trend Analysis', icon: TrendingUp, path: '/trend-analysis' },
    { id: 'alerts', label: 'Alerts', icon: Bell, path: '/alerts' },
    { id: 'devices', label: 'Devices', icon: Lightbulb, path: '/devices' },
    { id: 'cost', label: 'Cost & Efficiency', icon: TrendingUp, path: '/cost-efficiency' },
    //{ id: 'settings', label: 'Settings', icon: Settings, path: '/settings' }
  ];

  // useEffect(() => {
  //   const fetchTrendData = async () => {
  //     try {
  //       const token = localStorage.getItem("token");
  //       // ✅ 1. Fetch consumption trends
  //       const trendRes = await api.get(`/api/energy/trends?deviceId=${firstDeviceId}`);
  //       setConsumptionTrends(trendRes.data?.trends || []);

  //       // ✅ 2. Fetch AI predictions
  //        const devicesRes = await api.get(`/api/devices/${localStorage.getItem("userId")}`, {
  //       headers: { Authorization: `Bearer ${token}` },
  //     });

  //       const devices = devicesRes.data.devices;
  //       const firstDeviceId = devices[0].deviceId;       
        
  //       const aiRes = await api.get(`/api/ai/predictions/${firstDeviceId}`, {
  //         headers: { Authorization: `Bearer ${token}` },
  //       }); 
  //       setAiPrediction(aiRes.data || {});

  //       // ✅ 3. Fetch historical energy data
  //       const histRes = await api.get(`/api/energy/history?deviceId=${firstDeviceId}`);
  //       setHistoricalData(histRes.data?.history || []);

  //       // ✅ 4. Fetch insights (optional)
  //       const insightRes = await api.get(`/api/energy/insights?deviceId=${firstDeviceId}`);
  //       setInsights(insightRes.data?.insights || []);


  //     } catch (err) {
  //       console.error("Error fetching trend analysis data:", err);
  //     }
  //   };

  //   fetchTrendData();
  // }, []);
  const fetchTrendData = async () => {
      try {
        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("userId");
  
        // 1️⃣ Fetch user's devices first
        const devicesRes = await api.get(`/api/devices/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
  
        const devices = devicesRes.data.devices;
        if (!devices || devices.length === 0) {
          console.warn("No devices found for user.");
          return;
        }
      // 2️⃣ Fetch consumption trends (optional deviceId)
      // const trendRes = await api.get(`/api/energy/trends?deviceId=${firstDeviceId}`);
      const trendRes = await api.get(`/api/energy/trends?deviceId=${firstDeviceId}&period=24h`);

      setConsumptionTrends(trendRes.data?.trends || []);

      // 3️⃣ Fetch AI predictions
      const aiRes = await api.get(`/api/ai/predictions/${firstDeviceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAiPrediction(aiRes.data || {});

      // 4️⃣ Fetch historical energy data ✅ FIXED
      const histRes = await api.get(`/api/energy/history?deviceId=${firstDeviceId}`);
      // setHistoricalData(histRes.data?.history || []);
      // console.log("📊 Historical API response:", histRes.data);
      const formattedHistory = (histRes.data?.history || []).map(item => ({
  time: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  power: item.power
}));

console.log("🧭 Formatted historical data:", formattedHistory);
setHistoricalData(formattedHistory);


      // 5️⃣ Fetch insights ✅ optional but consistent
      const insightRes = await api.get(`/api/energy/insights?deviceId=${firstDeviceId}`);
      setInsights(insightRes.data?.insights || []);
    } catch (err) {
      console.error("Error fetching trend analysis data:", err);
    }
  };


  const firstDeviceId = "METER001"; // fallback just in case
  useEffect(() => {
    
  fetchTrendData();
}, []);


  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <Zap className="logo-icon" />
            <span className="logo-text">EchoTrack</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navigationItems.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <item.icon className="nav-icon" />
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            className="chatbot-button"
            onClick={() => setShowChatbot(!showChatbot)}
          >
            <MessageCircle className="chatbot-icon" />
            Ask our AI Assistant
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="dashboard-header">
          <div className="header-left">
            <h1 className="dashboard-title">Trend and Historical Analysis</h1>
            <p className="dashboard-subtitle">
              Analyze your energy consumption patterns and AI predictions
            </p>
          </div>
          <div className="header-right">
            <button className="download-button">
              <Download className="download-icon" />
              Download Report
            </button>
            <button className="notification-button">
              <Bell className="notification-icon" />
            </button>
            <div className="user-profile">
              <User className="user-icon" />
            </div>
          </div>
        </header>

        {/* ✅ Consumption Trends */}
        {/* <section className="trends-section">
          <h2 className="section-title">Consumption Trends</h2>
          {consumptionTrends.length === 0 ? (
            <p className="no-data">No trend data available.</p>
          ) : (
            <div className="trends-grid">
              {consumptionTrends.map((trend, index) => (
                <div key={index} className="trend-card">
                  <div className="trend-header">
                    <h3 className="trend-title">{trend.title || 'Unnamed Trend'}</h3>
                    <div className="trend-metrics">
                      <span className="trend-value">{trend.value ?? '--'}</span>
                      <span className={`trend-change ${trend.changeType || ''}`}>
                        {trend.change ?? ''}
                      </span>
                    </div>
                  </div>
                  {trend.data && (
                    <div className="trend-chart">
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={trend.data}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                          <XAxis dataKey="day" stroke="#666" />
                          <YAxis stroke="#666" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1a1a1a',
                              border: '1px solid #333',
                              borderRadius: '8px',
                              color: '#fff'
                            }}
                          />
                          <Bar
                            dataKey="consumption"
                            fill={trend.color || "#00d4ff"}
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section> */}
        <section className="trends-section">
  <div className="trends-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
    <h2 className="section-title">Consumption Trends</h2>
    
    {/* ✅ Refresh Button */}
    <button
      onClick={fetchTrendData}
      style={{
        backgroundColor: "#00d4ff",
        color: "#000",
        padding: "8px 14px",
        borderRadius: "8px",
        border: "none",
        fontWeight: "600",
        cursor: "pointer",
        transition: "0.2s",
      }}
      onMouseOver={(e) => (e.target.style.backgroundColor = "#00aacc")}
      onMouseOut={(e) => (e.target.style.backgroundColor = "#00d4ff")}
    >
      Refresh Data
    </button>
  </div>

  {consumptionTrends.length === 0 ? (
    <p className="no-data">No trend data available.</p>
  ) : (
    <div className="trends-grid">
      {consumptionTrends.map((trend, index) => (
        <div key={index} className="trend-card">
          <div className="trend-header">
            <h3 className="trend-title">{trend.title || "Unnamed Trend"}</h3>
            <div className="trend-metrics">
              <span className="trend-value">{trend.value ?? "--"}</span>
              <span className={`trend-change ${trend.changeType || ""}`}>
                {trend.change ?? ""}
              </span>
            </div>
          </div>

          {trend.data && (
            <div className="trend-chart">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={trend.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="label" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a1a1a",
                      border: "1px solid #333",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                  <Bar
                    dataKey="avgPower"
                    fill={trend.color || "#00d4ff"}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      ))}
    </div>
  )}
</section>


        {/* ✅ AI Prediction vs Actual */}
        {aiPrediction?.data && (
          <section className="prediction-section">
            <div className="prediction-card">
              <h3 className="prediction-title">{aiPrediction.title || 'AI Prediction'}</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={aiPrediction.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="month" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #333',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="actual"
                    stroke="#00d4ff"
                    fill="#00d4ff"
                    fillOpacity={0.3}
                  />
                  <Area
                    type="monotone"
                    dataKey="predicted"
                    stroke="#00ff88"
                    fill="#00ff88"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* ✅ Historical Data */}
        <section className="historical-section">
          <h2 className="section-title">Historical Analysis</h2>
          {historicalData.length === 0 ? (
            <p className="no-data">No historical data found.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="time" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="power"
                  stroke="#00d4ff"
                  strokeWidth={3}
                  dot={{ fill: '#00d4ff', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </section>
      </main>
    </div>
  );
};

export default TrendAnalysis;

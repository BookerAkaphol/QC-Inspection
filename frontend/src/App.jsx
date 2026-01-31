import { useState, useRef, useEffect } from 'react';
import './App.css';
import sncLogo from './assets/snc-logo.png';

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [logs, setLogs] = useState([]);

  const [selectedModel, setSelectedModel] = useState("688-1");

  const BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    if (!showHistory && !previewData) {
      initializeCamera();
    }
  }, [showHistory, previewData]);

  const initializeCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Camera API not supported."); return;
    }
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) { console.error(err); }
  };

  const processImageBlob = async (blob) => {
    setLoading(true);
    setCapturedBlob(blob);
    
    const formData = new FormData();
    formData.append('file', blob, 'scan.jpg');
    formData.append('model_name', selectedModel);

    try {
        const res = await fetch(`${BASE_URL}/preview`, { method: 'POST', body: formData });
        if (!res.ok) throw new Error("API Error");
        const data = await res.json();
        setPreviewData(data);
    } catch(e) {
        alert("Connection Failed.");
    } finally {
        setLoading(false);
    }
  };

  const captureFrame = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob((blob) => processImageBlob(blob), 'image/jpeg');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) processImageBlob(file);
  };

  const confirmSave = async () => {
    if (!capturedBlob) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', capturedBlob, 'final.jpg');
    formData.append('model_name', selectedModel);

    try {
        const res = await fetch(`${BASE_URL}/save`, { method: 'POST', body: formData });
        if (res.ok) resetScanner();
        else alert("Failed to save.");
    } catch(e) { alert("Network Error."); } 
    finally { setLoading(false); }
  };

  const resetScanner = () => {
    setPreviewData(null);
    setCapturedBlob(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setTimeout(initializeCamera, 100);
  };

  const fetchHistoryLogs = async () => {
    setLoading(true);
    try {
        const res = await fetch(`${BASE_URL}/logs`);
        const data = await res.json();
        setLogs(data);
        setShowHistory(true);
    } catch(e) { alert("Failed to load logs."); } 
    finally { setLoading(false); }
  };

  const toggleViewMode = () => {
      if (showHistory) {
          setShowHistory(false);
          setTimeout(initializeCamera, 100);
      } else {
          fetchHistoryLogs();
      }
  };

  return (
    <div className="app-container">
      {loading && (
        <div className="loading-overlay"><div className="spinner"></div><span>Processing...</span></div>
      )}

      <header className="app-header">
        <div className="brand">
            <div className="logo-box"><img src={sncLogo} alt="SNC Logo" className="snc-logo-img" /></div>
            <div className="brand-text"><h1>QC INSPECTION</h1><span>Smart Quality Control</span></div>
        </div>
        <button className="nav-btn" onClick={toggleViewMode}>{showHistory ? "Scan" : "History"}</button>
      </header>

      <main className="main-content">
        <div className="viewport-section">
            {showHistory ? (
                <div className="history-list">
                    {logs.map((log, index) => (
                        <div key={index} className="history-item">
                            {log.Filename ? (
                                <img src={`${BASE_URL}/images/${log.Filename}`} className="history-thumb" onClick={() => window.open(`${BASE_URL}/images/${log.Filename}`, '_blank')} />
                            ) : <div className="history-thumb"></div>}
                            <div className="history-info">
                                <div className="history-meta">{log.Datetime}</div>
                                {/* แสดงชื่อโมเดล */}
                                <div className="history-filename" style={{fontWeight:'bold', color:'#2563eb'}}>Model: {log.Model}</div>
                                <div className="history-filename">Ref: {log.Filename}</div>
                            </div>
                            <div className="history-result">
                                <div className={`status-tag text-${log.Status}`}>{log.Status}</div>
                                <div className="count-tag">{log.Count} Holes</div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className={`viewport-card ${previewData ? 'result-mode' : ''}`}>
                    {!previewData && (
                        <div className="scanner-overlay">
                            <div className="corner tl"></div><div className="corner tr"></div>
                            <div className="corner bl"></div><div className="corner br"></div>
                            <div className="scanner-line"></div>
                        </div>
                    )}
                    {!previewData ? (
                        <video ref={videoRef} autoPlay playsInline muted />
                    ) : (
                        <>
                            <div className={`status-badge ${previewData.status}`}><div className="dot"></div>{previewData.status}</div>
                            <img src={`data:image/jpeg;base64,${previewData.image_base64}`} className="preview-image" />
                        </>
                    )}
                    <canvas ref={canvasRef} style={{display:'none'}} />
                </div>
            )}
        </div>

        <div className="sidebar-section">
            <div className="controls-box">
                {!showHistory ? (
                    <>
                        <div className="panel-header">
                            <h3>Inspection Panel</h3>
                            <p>{!previewData ? "Ready to capture." : "Review results."}</p>
                        </div>

                        {/*Dropdown เลือก Model กลับมาแล้ว*/}
                        {!previewData && (
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '5px' }}>
                                    Select Model:
                                </label>
                                <select 
                                    value={selectedModel} 
                                    onChange={(e) => setSelectedModel(e.target.value)}
                                    style={{ 
                                        width: '100%', padding: '10px', borderRadius: '8px', 
                                        border: '1px solid #e2e8f0', fontSize: '1rem', 
                                        backgroundColor: '#ffffff', color: '#1e293b'
                                    }}
                                >
                                    <option value="688-1">688-1</option>
                                    <option value="688-2">688-2</option>
                                    <option value="688-3">688-3</option>
                                </select>
                            </div>
                        )}

                        {!previewData ? (
                            <>
                                <button onClick={captureFrame} className="btn btn-primary">📸 Capture</button>
                                <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{display:'none'}} accept="image/*" />
                                <button onClick={() => fileInputRef.current.click()} className="btn btn-outline">Upload</button>
                            </>
                        ) : (
                            <>
                                <button onClick={confirmSave} className="btn btn-success">Confirm</button>
                                <button onClick={resetScanner} className="btn btn-danger">Retry</button>
                            </>
                        )}
                    </>
                ) : (
                    <div className="panel-header">
                        <h3>Summary</h3>
                        <p>Total {logs.length} records found.</p>
                        <button onClick={() => window.open(`${BASE_URL}/download-excel`, '_blank')} className="btn btn-outline" style={{ marginBottom: '10px', borderColor: '#10b981', color: '#10b981' }}>📥 Download Report</button>
                        <button onClick={toggleViewMode} className="btn btn-primary">Back to Scanner</button>
                    </div>
                )}
            </div>
        </div>
      </main>
    </div>
  );
}

export default App;
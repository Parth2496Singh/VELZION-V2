import React, { useState, useEffect } from 'react';
import axios from 'axios';

axios.defaults.withCredentials = true;
axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';

export default function App() {
  const [user, setUser] = useState(null);
  const [repos, setRepos] = useState([]);
  const [iamRole, setIamRole] = useState('');
  
  // Deployment State
  const [deployments, setDeployments] = useState([]);
  const [repoUrl, setRepoUrl] = useState('');
  const [yamlConfig, setYamlConfig] = useState('byoc_mode: true\n');
  const [errorMsg, setErrorMsg] = useState('');
  
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  useEffect(() => {
    // Check if auth callback from github
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      axios.post(`${API_BASE}/api/auth/callback/`, { code })
        .then(res => {
          setUser(res.data.user);
          setRepos(res.data.repos || []);
          window.history.replaceState({}, document.title, "/");
        })
        .catch(err => setErrorMsg(err.message || 'Auth failed'));
    } else {
      // Basic check (relies on localstorage or standard endpoint if available)
      const stored = localStorage.getItem('velzion_user');
      if (stored) setUser(JSON.parse(stored));
    }
  }, []);

  const handleLogin = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/auth/login/url/`);
      window.location.href = res.data.login_url;
    } catch (err) {
      setErrorMsg('Login URL fetch failed: ' + err.message);
    }
  };

  const handleBindIAM = async () => {
    try {
      await axios.post(`${API_BASE}/api/auth/bind_iam/`, { arn: iamRole });
      alert("IAM Role Bound");
    } catch (err) {
      setErrorMsg('IAM Bind failed: ' + err.message);
    }
  };

  const fetchDeployments = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/velzard/deployments/`);
      setDeployments(res.data);
    } catch (err) {
      setErrorMsg('Fetch deployments failed: ' + err.message);
    }
  };

  const [ephemeralEnvs, setEphemeralEnvs] = useState([]);
  const fetchZegionEnvs = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/environments/?repo=${repoUrl}`);
      setEphemeralEnvs(res.data);
    } catch (err) {
      setErrorMsg('Fetch Zegion envs failed: ' + err.message);
    }
  };

  const handleDeploy = async () => {
    try {
      const res = await axios.post(`${API_BASE}/api/velzard/deployments/`, {
        github_repo_url: repoUrl,
        branch: 'main',
        instance_type: 't3.small',
        volume_size: 30
      });
      const deploymentId = res.data.id;
      // Trigger Deploy right away
      await axios.post(`${API_BASE}/api/velzard/deployments/${deploymentId}/trigger_deploy/`);
      fetchDeployments();
    } catch (err) {
      setErrorMsg('Deploy failed: ' + err.message);
    }
  };

  const handleDestroy = async (id) => {
    try {
      await axios.post(`${API_BASE}/api/velzard/deployments/${id}/destroy_cluster/`);
      fetchDeployments();
    } catch (err) {
      setErrorMsg('Destroy failed: ' + err.message);
    }
  };

  const handleTerminateZegion = async (id) => {
    try {
      await axios.post(`${API_BASE}/api/environments/${id}/terminate/`, { user: user.username });
      fetchZegionEnvs();
    } catch (err) {
      setErrorMsg('Terminate Zegion failed: ' + err.message);
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace', color: '#eee', background: '#111', minHeight: '100vh' }}>
      <h1>Velzion Bare-Metal Control Plane</h1>
      
      {errorMsg && (
        <div style={{ color: 'red', border: '1px solid red', padding: '1rem', marginBottom: '1rem' }}>
          <strong>ERROR:</strong> {errorMsg}
          <button onClick={() => setErrorMsg('')} style={{ marginLeft: '1rem' }}>Dismiss</button>
        </div>
      )}

      {!user ? (
        <div>
          <button onClick={handleLogin}>Login with GitHub</button>
        </div>
      ) : (
        <div>
          <h3>Logged in as: {user.username}</h3>
          
          <div style={{ border: '1px solid #333', padding: '1rem', marginTop: '1rem' }}>
            <h4>IAM Role Configuration</h4>
            <input 
              value={iamRole} 
              onChange={e => setIamRole(e.target.value)} 
              placeholder="arn:aws:iam::..." 
              style={{ width: '300px' }}
            />
            <button onClick={handleBindIAM}>Bind Role</button>
          </div>

          <div style={{ border: '1px solid #333', padding: '1rem', marginTop: '1rem' }}>
            <h4>Deploy Production Cluster (Velzard)</h4>
            <div>
              <input 
                value={repoUrl} 
                onChange={e => setRepoUrl(e.target.value)} 
                placeholder="https://github.com/owner/repo" 
                style={{ width: '300px', display: 'block', marginBottom: '10px' }}
              />
              <textarea 
                value={yamlConfig} 
                onChange={e => setYamlConfig(e.target.value)}
                style={{ width: '100%', height: '100px', display: 'block', marginBottom: '10px' }}
              />
              <button onClick={handleDeploy}>Trigger Deploy</button>
            </div>
          </div>

          <div style={{ border: '1px solid #333', padding: '1rem', marginTop: '1rem' }}>
            <h4>Active Deployments (Velzard)</h4>
            <button onClick={fetchDeployments}>Refresh Status</button>
            <pre style={{ background: '#000', padding: '1rem', overflowX: 'auto', marginTop: '1rem' }}>
              {JSON.stringify(deployments, null, 2)}
            </pre>
            
            {deployments.map(d => (
              <div key={d.id} style={{ borderBottom: '1px solid #222', padding: '10px 0' }}>
                <p>ID: {d.id} | Status: {d.status}</p>
                <button onClick={() => handleDestroy(d.id)}>Destroy Cluster</button>
              </div>
            ))}
          </div>

          <div style={{ border: '1px solid #333', padding: '1rem', marginTop: '1rem' }}>
            <h4>Active Zegion Environments (Spot PRs)</h4>
            <button onClick={fetchZegionEnvs}>Refresh Status</button>
            <pre style={{ background: '#000', padding: '1rem', overflowX: 'auto', marginTop: '1rem' }}>
              {JSON.stringify(ephemeralEnvs, null, 2)}
            </pre>
            
            {ephemeralEnvs.map(e => (
              <div key={e.id} style={{ borderBottom: '1px solid #222', padding: '10px 0' }}>
                <p>PR: {e.pr_number} | Status: {e.status}</p>
                <button onClick={() => handleTerminateZegion(e.id)}>Terminate Spot Instance</button>
              </div>
            ))}
          </div>

        </div>
      )}
    </div>
  );
}
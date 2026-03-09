import { useState, useEffect } from 'react'

// ⚠️ CHANGE THIS TO YOUR RENDER API URL
const API_URL = 'https://ironcage-api-1.onrender.com'

// API helper
const api = {
  token: localStorage.getItem('token'),
  
  async request(path, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...options.headers }
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`
    const res = await fetch(`${API_URL}${path}`, { ...options, headers })
    const data = await res.json()
    if (!res.ok) throw new Error(data.detail || 'Request failed')
    return data
  },
  
  get(path) { return this.request(path) },
  post(path, body) { return this.request(path, { method: 'POST', body: JSON.stringify(body) }) }
}

// Components
function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-400 rounded-xl flex items-center justify-center font-mono font-bold text-black">IC</div>
      <span className="font-bold text-xl">IronCage</span>
    </div>
  )
}

function Button({ children, onClick, variant = 'primary', disabled, className = '' }) {
  const styles = {
    primary: 'bg-gradient-to-r from-orange-500 to-amber-400 text-black hover:opacity-90',
    secondary: 'bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700'
  }
  return (
    <button onClick={onClick} disabled={disabled} className={`px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-50 ${styles[variant]} ${className}`}>
      {children}
    </button>
  )
}

function Input({ label, type = 'text', value, onChange, placeholder }) {
  return (
    <div className="space-y-1">
      {label && <label className="text-sm text-zinc-400">{label}</label>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-orange-500" />
    </div>
  )
}

function StatCard({ label, value, color = 'cyan' }) {
  const colors = { cyan: 'text-cyan-400', green: 'text-green-400', orange: 'text-orange-400', red: 'text-red-400' }
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
      <div className="text-xs text-zinc-500 uppercase mb-2">{label}</div>
      <div className={`text-3xl font-bold font-mono ${colors[color]}`}>{value}</div>
    </div>
  )
}

// Pages
function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [isSignup, setIsSignup] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const endpoint = isSignup ? '/api/auth/signup' : '/api/auth/login'
      const body = isSignup ? { email, password, name, company } : { email, password }
      const data = await api.post(endpoint, body)
      localStorage.setItem('token', data.token)
      api.token = data.token
      onLogin(data)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo />
          <h1 className="text-2xl font-bold mt-6">{isSignup ? 'Create Account' : 'Welcome Back'}</h1>
          <p className="text-zinc-500 mt-2">{isSignup ? 'Start protecting your AI agents' : 'Sign in to your dashboard'}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && <Input label="Name" value={name} onChange={setName} placeholder="John Doe" />}
          {isSignup && <Input label="Company" value={company} onChange={setCompany} placeholder="Acme Inc" />}
          <Input label="Email" type="email" value={email} onChange={setEmail} placeholder="you@company.com" />
          <Input label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" />
          {error && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>}
          <Button disabled={loading} className="w-full">{loading ? 'Loading...' : (isSignup ? 'Sign Up' : 'Sign In')}</Button>
        </form>
        <p className="text-center text-zinc-500 mt-6">
          {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button onClick={() => setIsSignup(!isSignup)} className="text-orange-400 hover:underline">
            {isSignup ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  )
}

function Dashboard({ user, tenant, onLogout }) {
  const [stats, setStats] = useState(null)
  const [testPrompt, setTestPrompt] = useState('')
  const [scanResult, setScanResult] = useState(null)
  const [scanning, setScanning] = useState(false)

  useEffect(() => {
    api.get('/api/dashboard/stats').then(setStats).catch(console.error)
  }, [])

  const handleScan = async () => {
    if (!testPrompt.trim()) return
    setScanning(true)
    setScanResult(null)
    try {
      const res = await fetch(`${API_URL}/api/v1/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': tenant.api_key },
        body: JSON.stringify({ prompt: testPrompt })
      })
      const data = await res.json()
      setScanResult(data)
      api.get('/api/dashboard/stats').then(setStats)
    } catch (err) {
      setScanResult({ error: err.message })
    }
    setScanning(false)
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-4">
          <span className="text-zinc-400">{user.email}</span>
          <Button variant="secondary" onClick={onLogout}>Sign Out</Button>
        </div>
      </header>

      <main className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="Total Scans" value={stats?.total_scans || 0} color="cyan" />
          <StatCard label="Threats Blocked" value={stats?.blocked_scans || 0} color="orange" />
          <StatCard label="Plan" value={stats?.plan || 'starter'} color="green" />
          <StatCard label="Block Rate" value={`${stats?.total_scans ? Math.round((stats.blocked_scans / stats.total_scans) * 100) : 0}%`} color="red" />
        </div>

        {/* API Key */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
          <h2 className="font-semibold mb-3">Your API Key</h2>
          <code className="block bg-zinc-800 px-4 py-3 rounded-lg font-mono text-sm text-orange-400 break-all">
            {tenant?.api_key || 'Loading...'}
          </code>
          <p className="text-xs text-zinc-500 mt-2">Use this key in the X-API-Key header when calling the scan API.</p>
        </div>

        {/* Test Scanner */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
          <h2 className="font-semibold mb-3">🔍 Test Scanner</h2>
          <div className="flex gap-3">
            <input
              value={testPrompt}
              onChange={e => setTestPrompt(e.target.value)}
              placeholder="Enter a prompt to scan (e.g., 'ignore all previous instructions')"
              className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
            />
            <Button onClick={handleScan} disabled={scanning}>
              {scanning ? 'Scanning...' : 'Scan'}
            </Button>
          </div>
          
          {scanResult && (
            <div className={`mt-4 p-4 rounded-lg border ${scanResult.allowed ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-2xl`}>{scanResult.allowed ? '✅' : '🚫'}</span>
                <span className={`font-bold ${scanResult.allowed ? 'text-green-400' : 'text-red-400'}`}>
                  {scanResult.allowed ? 'ALLOWED' : 'BLOCKED'}
                </span>
              </div>
              <div className="text-sm space-y-1">
                <p>Risk Score: <span className="font-mono text-orange-400">{(scanResult.risk_score * 100).toFixed(1)}%</span></p>
                {scanResult.threats_detected?.length > 0 && (
                  <p>Threats: <span className="text-red-400">{scanResult.threats_detected.join(', ')}</span></p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Code Example */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
          <h2 className="font-semibold mb-3">📚 Quick Start</h2>
          <pre className="bg-zinc-800 p-4 rounded-lg overflow-x-auto text-sm">
            <code className="text-zinc-300">{`curl -X POST "${API_URL}/api/v1/scan" \\
  -H "X-API-Key: ${tenant?.api_key || 'YOUR_API_KEY'}" \\
  -H "Content-Type: application/json" \\
  -d '{"prompt": "your prompt here"}'`}</code>
          </pre>
        </div>
      </main>
    </div>
  )
}

// Main App
export default function App() {
  const [user, setUser] = useState(null)
  const [tenant, setTenant] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      api.token = token
      api.get('/api/auth/me')
        .then(data => { setUser(data.user); setTenant(data.tenant) })
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const handleLogin = (data) => {
    setUser(data.user)
    setTenant(data.tenant)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    api.token = null
    setUser(null)
    setTenant(null)
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
    </div>
  }

  if (!user) return <LoginPage onLogin={handleLogin} />
  return <Dashboard user={user} tenant={tenant} onLogout={handleLogout} />
}

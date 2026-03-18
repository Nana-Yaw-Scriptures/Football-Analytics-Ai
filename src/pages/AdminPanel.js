import React, { useState } from 'react';
import { ArrowLeft, Plus, Edit, Trash2, Save, X, Shield } from 'lucide-react';
import { allPlayers } from '../playerData';

function AdminPanel({ onNavigate }) {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeSection, setActiveSection] = useState('players');
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [players, setPlayers] = useState(allPlayers);

  // Simple password check (change this to your own password)
  const ADMIN_PASSWORD = 'admin123';

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
    } else {
      alert('Wrong password!');
    }
  };

  const handleEditPlayer = (player) => {
    setEditingPlayer({...player});
  };

  const handleSavePlayer = () => {
    const index = players.findIndex(p => p.name === editingPlayer.name && p.team === editingPlayer.team);
    if (index !== -1) {
      const newPlayers = [...players];
      newPlayers[index] = editingPlayer;
      setPlayers(newPlayers);
      setEditingPlayer(null);
      alert('Player updated! Copy the data below to update playerData.js');
    }
  };

  const handleDeletePlayer = (player) => {
    if (window.confirm(`Delete ${player.name}?`)) {
      setPlayers(players.filter(p => !(p.name === player.name && p.team === player.team)));
    }
  };

  const handleAddPlayer = () => {
    const newPlayer = {
      name: 'New Player',
      team: 'Team Name',
      league: 'Premier League',
      position: 'Forward',
      stats: '0 Goals | 0 Assists',
      image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400&h=400&fit=crop',
      lastUpdated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };
    setPlayers([...players, newPlayer]);
    setEditingPlayer(newPlayer);
  };

  const exportData = () => {
    const dataString = `export const allPlayers = ${JSON.stringify(players, null, 2)};`;
    navigator.clipboard.writeText(dataString);
    alert('Data copied to clipboard! Paste this into playerData.js');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/10 max-w-md w-full">
          <div className="text-center mb-8">
            <Shield className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">Admin Panel</h1>
            <p className="text-gray-400">Enter password to access</p>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="Enter admin password"
            className="w-full p-4 rounded-lg bg-white/20 text-white placeholder-gray-400 border-2 border-white/30 focus:border-green-400 focus:outline-none mb-4"
          />
          <button
            onClick={handleLogin}
            className="w-full px-6 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-all"
          >
            Login
          </button>
          <button
            onClick={() => onNavigate('home')}
            className="w-full mt-3 px-6 py-3 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition-all"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      
      {/* Navigation */}
      <nav className="bg-black/20 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Site
            </button>
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-green-400" />
              <span className="text-2xl font-bold text-white">Admin Panel</span>
            </div>
          </div>
          <button
            onClick={exportData}
            className="px-6 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-all flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            Export Data
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        
        {/* Section Tabs */}
        <div className="flex gap-3 mb-8">
          <button
            onClick={() => setActiveSection('players')}
            className={`px-6 py-3 rounded-lg font-semibold ${
              activeSection === 'players' ? 'bg-green-500 text-white' : 'bg-white/10 text-gray-300'
            }`}
          >
            Manage Players ({players.length})
          </button>
          <button
            onClick={() => setActiveSection('leagues')}
            className={`px-6 py-3 rounded-lg font-semibold ${
              activeSection === 'leagues' ? 'bg-green-500 text-white' : 'bg-white/10 text-gray-300'
            }`}
          >
            Manage League Tables
          </button>
        </div>

        {/* Players Section */}
        {activeSection === 'players' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-white">Manage Players</h2>
              <button
                onClick={handleAddPlayer}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Player
              </button>
            </div>

            {/* Players List */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10">
              <div className="grid grid-cols-12 gap-4 p-4 bg-white/10 font-semibold text-white text-sm">
                <div className="col-span-3">Player</div>
                <div className="col-span-2">Team</div>
                <div className="col-span-2">League</div>
                <div className="col-span-1">Position</div>
                <div className="col-span-2">Stats</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>

              {players.map((player, index) => (
                <div 
                  key={index}
                  className="grid grid-cols-12 gap-4 p-4 border-b border-white/5 items-center hover:bg-white/5"
                >
                  <div className="col-span-3 text-white font-semibold">{player.name}</div>
                  <div className="col-span-2 text-gray-300 text-sm">{player.team}</div>
                  <div className="col-span-2 text-gray-400 text-sm">{player.league}</div>
                  <div className="col-span-1 text-gray-400 text-sm">{player.position}</div>
                  <div className="col-span-2 text-green-400 text-sm">{player.stats}</div>
                  <div className="col-span-2 flex justify-end gap-2">
                    <button
                      onClick={() => handleEditPlayer(player)}
                      className="p-2 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/40"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePlayer(player)}
                      className="p-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/40"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* League Tables Section */}
        {activeSection === 'leagues' && (
          <div>
            <h2 className="text-3xl font-bold text-white mb-6">Manage League Tables</h2>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10">
              <p className="text-gray-300 mb-4">Update league standings in <code className="bg-white/10 px-2 py-1 rounded">src/leagueStandings.js</code></p>
              <p className="text-gray-400 text-sm">Each league table is stored in the leagueStandings object. Edit the file directly or use FBref/official sites for current standings.</p>
            </div>
          </div>
        )}

      </div>

      {/* Edit Player Modal */}
      {editingPlayer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-slate-800 rounded-2xl p-8 max-w-2xl w-full border border-white/10 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">Edit Player</h3>
              <button
                onClick={() => setEditingPlayer(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-white font-semibold mb-2">Name</label>
                <input
                  type="text"
                  value={editingPlayer.name}
                  onChange={(e) => setEditingPlayer({...editingPlayer, name: e.target.value})}
                  className="w-full p-3 rounded-lg bg-white/10 text-white border border-white/20 focus:border-green-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">Team</label>
                <input
                  type="text"
                  value={editingPlayer.team}
                  onChange={(e) => setEditingPlayer({...editingPlayer, team: e.target.value})}
                  className="w-full p-3 rounded-lg bg-white/10 text-white border border-white/20 focus:border-green-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">League</label>
                <select
                  value={editingPlayer.league}
                  onChange={(e) => setEditingPlayer({...editingPlayer, league: e.target.value})}
                  className="w-full p-3 rounded-lg bg-white/10 text-white border border-white/20 focus:border-green-400 focus:outline-none"
                >
                  <option value="Premier League">Premier League</option>
                  <option value="La Liga">La Liga</option>
                  <option value="Bundesliga">Bundesliga</option>
                  <option value="Serie A">Serie A</option>
                  <option value="Ligue 1">Ligue 1</option>
                </select>
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">Position</label>
                <select
                  value={editingPlayer.position}
                  onChange={(e) => setEditingPlayer({...editingPlayer, position: e.target.value})}
                  className="w-full p-3 rounded-lg bg-white/10 text-white border border-white/20 focus:border-green-400 focus:outline-none"
                >
                  <option value="Forward">Forward</option>
                  <option value="Winger">Winger</option>
                  <option value="Midfielder">Midfielder</option>
                  <option value="Defender">Defender</option>
                  <option value="Goalkeeper">Goalkeeper</option>
                </select>
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">Stats (format: "X Goals | Y Assists")</label>
                <input
                  type="text"
                  value={editingPlayer.stats}
                  onChange={(e) => setEditingPlayer({...editingPlayer, stats: e.target.value})}
                  placeholder="20 Goals | 5 Assists"
                  className="w-full p-3 rounded-lg bg-white/10 text-white border border-white/20 focus:border-green-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">Image URL</label>
                <input
                  type="text"
                  value={editingPlayer.image}
                  onChange={(e) => setEditingPlayer({...editingPlayer, image: e.target.value})}
                  className="w-full p-3 rounded-lg bg-white/10 text-white border border-white/20 focus:border-green-400 focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSavePlayer}
                  className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingPlayer(null)}
                  className="px-6 py-3 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Instructions */}
      {activeSection === 'players' && (
        <div className="mt-8 bg-yellow-500/10 backdrop-blur-sm rounded-xl p-6 border border-yellow-500/30">
          <h3 className="text-yellow-400 font-bold mb-2">💡 How to Save Changes</h3>
          <ol className="text-gray-300 text-sm space-y-2">
            <li>1. Make your edits above</li>
            <li>2. Click "Export Data" button (top right)</li>
            <li>3. Data is copied to clipboard</li>
            <li>4. Open <code className="bg-white/10 px-2 py-1 rounded">src/playerData.js</code> in VS Code</li>
            <li>5. Replace the <code className="bg-white/10 px-2 py-1 rounded">allPlayers</code> array</li>
            <li>6. Save the file - changes appear on site!</li>
          </ol>
        </div>
      )}

    </div>
  );
}

export default AdminPanel;
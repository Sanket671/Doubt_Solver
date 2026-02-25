import { useState, useEffect } from 'react';
import axios from 'axios';
import './index.css';

// Base URL from environment variable (set in Vercel)
const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

function App() {
  const [questions, setQuestions] = useState([]);
  const [solved, setSolved] = useState([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [summary, setSummary] = useState('');
  const [showSolved, setShowSolved] = useState(false);

  const fetchQueue = async () => {
    const { data } = await API.get('/questions');
    setQuestions(data);
  };

  const fetchSolved = async () => {
    const { data } = await API.get('/questions/solved');
    setSolved(data);
  };

  const registerPushSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY
        });
      }
      await API.post('/subscribe', subscription);
    } catch (err) {
      console.error('Push subscription failed', err);
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      await Notification.requestPermission();
    }
    if ('serviceWorker' in navigator && Notification.permission === 'granted') {
      registerPushSubscription();
    }
  };

  useEffect(() => {
    (async () => {
      try {
        await fetchQueue();
        await fetchSolved();
        await requestNotificationPermission();
      } catch (err) {
        console.error('Initialization failed', err);
      }
    })();
  }, []);

  const addQuestion = async () => {
    if (!newQuestion.trim()) return;
    const { data } = await API.post('/questions', { text: newQuestion });
    setQuestions([...questions, data]);
    setNewQuestion('');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const pasteSummary = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setSummary(text);
    } catch (err) {
      alert('Failed to read clipboard. Paste manually?');
    }
  };

  const markSolved = async () => {
    if (questions.length === 0) return;
    const current = questions[0];
    await API.patch(`/questions/${current._id}`, { summary, solved: true });
    fetchQueue();
    fetchSolved();
    setSummary('');
  };

  const askChatGPT = () => {
    if (questions.length === 0) {
      alert('No current question');
      return;
    }
    copyToClipboard(questions[0].text);
    window.open('https://chat.openai.com', '_blank');
  };

  return (
    <div className="container">
      <h1>🧠 TaskQueue Learning</h1>

      <div className="add-section">
        <input
          type="text"
          placeholder="New question..."
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
        />
        <button onClick={addQuestion}>➕ Add</button>
      </div>

      {questions.length > 0 && (
        <div className="current-question">
          <h3>Current Question</h3>
          <p>{questions[0].text}</p>
          <div className="actions">
            <button onClick={askChatGPT}>🤖 Ask ChatGPT</button>
          </div>
          <div className="summary-area">
            <textarea
              placeholder="Paste summary here..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
            <button onClick={pasteSummary}>📋 Paste Summary</button>
            <button onClick={markSolved}>✔ Mark Solved</button>
          </div>
        </div>
      )}

      <div className="queue">
        <h3>Upcoming Questions ({questions.length - (questions.length > 0 ? 1 : 0)})</h3>
        <ul>
          {questions.slice(1).map((q) => (
            <li key={q._id}>{q.text}</li>
          ))}
        </ul>
      </div>

      <div className="solved-toggle">
        <button onClick={() => setShowSolved(!showSolved)}>
          {showSolved ? 'Hide' : 'Show'} Solved Questions
        </button>
      </div>

      {showSolved && (
        <div className="solved-list">
          <h3>📚 Knowledge Base</h3>
          <ul>
            {solved.map((s) => (
              <li key={s._id}>
                <strong>{s.text}</strong> – {s.summary}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;

import React from 'react'
import 'draft-js/dist/Draft.css'
import './App.css'
import TodoEditor from './components/TodoEditor'

function App() {
  return (
    <div className="container">
      <TodoEditor />
    </div>
  );
}

export default App;

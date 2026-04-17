import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';
import { bootstrapLocalSandbox } from './devSandbox/bootstrap';
import './styles.css';

async function startApp() {
  await bootstrapLocalSandbox();

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

void startApp();

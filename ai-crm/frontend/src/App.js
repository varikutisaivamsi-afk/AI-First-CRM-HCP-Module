import React from 'react';
import { Provider } from 'react-redux';
import store from './store';
import LogInteractionPage from './pages/LogInteractionPage';

function App() {
  return (
    <Provider store={store}>
      <LogInteractionPage />
    </Provider>
  );
}

export default App;

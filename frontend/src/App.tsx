import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import './theme';
import './style/index.less';

const App: React.FC = () => {
  return (
    <RouterProvider router={router} />
  );
};

export default App;

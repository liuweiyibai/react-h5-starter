import React, { FC, useRef, RefObject } from 'react';
import useScroll from '../../utils/hooks/useMousePosition';
import logo from './logo.svg';
import styles from './App.module.less';

// console.log('==============app===================');
// console.log(styles);
// console.log('====================================');

const App: FC = () => {
  const divRef = useRef(null);
  const { position } = useScroll<HTMLDivElement>(divRef);
  return (
    <div className={`${styles.App} ${styles.text}`} ref={divRef}>
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
};

export default App;

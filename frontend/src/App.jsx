import React from 'react';
import Navbar from './component/Navbar';
import Tabs from './component/Tabs';
import Content from './component/Content';
import Footer from './component/Footer';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  return (
    <div className="App">
      <div>
        <Navbar />
      </div>
      <div>
        <Tabs />
      </div>
      <div>
        <Content />
      </div>
      <div>
        <Footer />
      </div>
    </div>

  );
}

export default App;

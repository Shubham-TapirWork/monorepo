import React from 'react';
import Navbar from './component/Navbar';
import Footer from './component/Footer';
import Firstpage from './component/1stpage';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Content from './component/Content';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          {/* Main page route */}
          <Route path="/" element={<Firstpage />} />

          {/* Content page route */}
          <Route path="/content" element={<Content />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;

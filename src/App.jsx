import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Merger from "./pages/Merger";
import Lyrics from "./pages/Lyrics";
import Separator from "./pages/Separator";
import Music from "./pages/Music";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <div style={{ padding: "24px" }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/merger" element={<Merger />} />
          <Route path="/lyrics" element={<Lyrics />} />
          <Route path="/separator" element={<Separator />} />
           <Route path="/music" element={<Music />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

import TranscribeSection from "../components/TranscribeSection";
import TranslateSection from "../components/TranslateSection";
import LyricsGenerator from "../components/LyricsGenerator";
export default function Lyrics() {
  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "24px" }}>
      <h1>Lyrics Tools</h1>

      <TranscribeSection />
      <TranslateSection />
      <LyricsGenerator/>
    </div>
  );
}

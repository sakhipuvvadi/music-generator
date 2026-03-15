import TranscribeSection from "../components/TranscribeSection";
import TranslateSection from "../components/TranslateSection";

export default function Lyrics() {
  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "24px" }}>
      <h1>Lyrics Tools</h1>

      <TranscribeSection />
      <TranslateSection />
    </div>
  );
}

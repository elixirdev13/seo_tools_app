// src/pages/index.tsx
import { useState } from 'react';
import axios from 'axios';

interface AnalysisResult {
  headings: Record<string, number>;
  wordsInHeadings: Record<string, string[]>;
  duplicateH1Words: string[];
}

const Home: React.FC = () => {
  const [url, setUrl] = useState<string>('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const { data } = await axios.post<AnalysisResult>('/api/analyze', { url });
      setAnalysis(data);
    } catch (error) {
      console.error("Failed to analyze URL", error);
      setAnalysis(null);
    }
  };

  return (
    <div>
      <h1>Webpage Analyzer</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter URL"
        />
        <button type="submit">Analyze</button>
      </form>
      {analysis && (
        <div>
          <h2>Results:</h2>
          <div>
            <h3>Headings Count:</h3>
            {Object.entries(analysis.headings).map(([tag, count]) => (
              <p key={tag}>
                {tag.toUpperCase()}: {count}
              </p>
            ))}
          </div>
          <div>
            <h3>Words in Headings:</h3>
            {Object.entries(analysis.wordsInHeadings).map(([tag, words]) => (
              <div key={tag}>
                <h4>{tag.toUpperCase()}:</h4>
                <ul>
                  {words.map((word, index) => (
                    <li key={index}>{word}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {analysis.duplicateH1Words.length > 0 && (
            <div>
              <h3>Duplicate H1 Words:</h3>
              <ul>
                {analysis.duplicateH1Words.map((word, index) => (
                  <li key={index}>{word}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Home;

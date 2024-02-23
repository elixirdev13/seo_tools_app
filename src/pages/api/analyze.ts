// src/pages/api/analyze.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import cheerio from 'cheerio';

interface AnalysisResult {
  headings: Record<string, number>;
  wordsInHeadings: Record<string, string[]>; // Added to include words for each heading type
  duplicateH1Words: string[];
}

export default async (req: NextApiRequest, res: NextApiResponse<AnalysisResult | { error: string }>) => {
  if (req.method === 'POST') {
    const { url } = req.body;
    try {
      const { data } = await axios.get(url.toString());
      const $ = cheerio.load(data);
      const headings: Record<string, number> = {};
      const wordsInHeadings: Record<string, string[]> = {}; // Record to store words found in each heading type
      const h1Words: string[] = [];

      $('h1, h2, h3, h4, h5, h6').each((_, element) => {
        const tagName = element.tagName.toLowerCase();
        headings[tagName] = (headings[tagName] || 0) + 1;
        
        const text = $(element).text().trim();
        const words = text.split(/\s+/); // Split by whitespace to get words
        
        if (!wordsInHeadings[tagName]) {
          wordsInHeadings[tagName] = [];
        }
        
        wordsInHeadings[tagName].push(...words); // Add words to the respective heading's array

        if (tagName === 'h1') {
          words.forEach(word => h1Words.push(word.toLowerCase()));
        }
      });

      // Ensure unique words per heading type
      Object.keys(wordsInHeadings).forEach(tag => {
        wordsInHeadings[tag] = Array.from(new Set(wordsInHeadings[tag]));
      });

      const duplicateH1Words = h1Words
        .filter((word, index, self) => self.indexOf(word) !== index && word.trim() !== '')
        .filter((value, index, self) => self.indexOf(value) === index); // Unique duplicates

      res.status(200).json({ headings, wordsInHeadings, duplicateH1Words });
    } catch (error) {
      res.status(500).json({ error: "Error fetching the URL" });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};

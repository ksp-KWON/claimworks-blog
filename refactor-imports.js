const fs = require('fs');
const files = [
  'src/components/calculator/AutoCalculator.tsx',
  'src/components/calculator/MedicalCalculator.tsx',
  'src/components/calculator/liability/LiabilityCalculator.tsx'
];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/import \{ toPng \} from 'html-to-image';\r?\nimport \{? ?jsPDF ?\}? from 'jspdf';/, 'import { useCalculatorExport } from "@/hooks/useCalculatorExport";');
  fs.writeFileSync(f, content);
  console.log('Updated imports in ' + f);
});

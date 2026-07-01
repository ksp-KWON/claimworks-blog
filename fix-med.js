const fs = require('fs');
let c = fs.readFileSync('src/components/calculator/MedicalCalculator.tsx', 'utf8');
c = c.replace(/shareResult\('실손의료비', totalCost\)/, "shareResult('실손의료비', result.totalPayout)");
fs.writeFileSync('src/components/calculator/MedicalCalculator.tsx', c);
console.log('Fixed MedicalCalculator');

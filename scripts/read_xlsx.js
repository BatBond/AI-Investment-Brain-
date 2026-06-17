const XLSX = require('xlsx');
const wb = XLSX.readFile('/home/z/my-project/upload/Portfolio_Positions_Jun-17-2026.xlsx');
console.log('Sheets:', wb.SheetNames);
console.log('---');
wb.SheetNames.forEach(name => {
  const ws = wb.Sheets[name];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
  console.log('=== Sheet: ' + name + ' ===');
  console.log('Rows: ' + data.length);
  console.log('All rows:');
  data.forEach((row, i) => console.log('  [' + i + '] ' + JSON.stringify(row)));
  console.log('');
});

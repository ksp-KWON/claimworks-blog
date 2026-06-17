// scripts/test-beopmang.js
async function main() {
  try {
    const q = '기왕증';
    const url = `https://api.beopmang.org/api/v4/case?action=search&q=${encodeURIComponent(q)}`;
    console.log(`Fetching: ${url}`);
    
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (!res.ok) {
      console.error(`HTTP Error: ${res.status}`);
      return;
    }
    const data = await res.json();
    console.log("Response Type:", typeof data);
    console.log("Is Array?", Array.isArray(data));
    if (Array.isArray(data)) {
      console.log("Length:", data.length);
      if (data.length > 0) {
        console.log("First item keys:", Object.keys(data[0]));
        console.log("First item snippet:", JSON.stringify(data[0], null, 2).substring(0, 1000));
      }
    } else {
      console.log("Keys:", Object.keys(data));
      // 만약 { results: [...] } 형태라면
      for (const key of Object.keys(data)) {
        if (Array.isArray(data[key])) {
          console.log(`Array key "${key}" length:`, data[key].length);
          if (data[key].length > 0) {
            console.log(`First item inside "${key}":`, Object.keys(data[key][0]));
            console.log("Snippet:", JSON.stringify(data[key][0], null, 2).substring(0, 1000));
          }
        }
      }
    }
  } catch (error) {
    console.error("Error:", error);
  }
}
main();

const fetch = require("node-fetch"); // wait node 18 has fetch native
async function run() {
  const url = "https://api.airforce/v1/imagine2?model=flux&prompt=cat";
  const r = await fetch(url);
  const text = await r.text();
  const index = text.indexOf("<img");
  if (index !== -1) {
    console.log(text.substring(index, index + 200));
  } else {
    console.log("No img tag");
  }
}
run();

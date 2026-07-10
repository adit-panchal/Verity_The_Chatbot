const baseUrl =
  "https://image.pollinations.ai/prompt/Generate%20image%20of%20cockatiel%20on%20a%20branch?width=1024&height=1024";

async function test(suffix) {
  try {
    const url = baseUrl + suffix;
    const res = await fetch(url);
    console.log(suffix || "(none)", "=>", res.status);
  } catch (err) {
    console.error(suffix, "=>", err.message);
  }
}

async function run() {
  await test("");
  await test("&seed=1771587148369");
  await test("&model=flux");
  await test("&nologo=true");
  await test("&seed=123&model=flux&nologo=true");
}
run();

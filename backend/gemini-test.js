// const { GoogleGenerativeAI } = require("@google/generative-ai");
// require("dotenv").config(); 

// async function runGemini() {
//     const genAI = new GoogleGenerativeAI("GEMINI_API_KEY");

//   const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

//   try {
//     const result = await model.generateContent("Explain how AI works");
//     const response = await result.response;
//     const text = response.text();

//     console.log("✅ Gemini Response:\n", text);
//   } catch (err) {
//     console.error("❌ Gemini API error:", err);
//   }
// }

// runGemini();
// gemini-test.js
require("dotenv").config(); // 👈 THIS MUST BE FIRST

const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY.trim());

async function runGemini() {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
  const result = await model.generateContent("Explain how AI works");
  console.log(result.response.text());
}
runGemini();

const express = require('express');
const bodyParser = require('body-parser');
const catchAsyncError = require('../middleware/catchAsyncError');
const fs = require('fs');
const path = require('path');
const spawner = require('child_process').spawn;

// Replace with your actual API key fetching mechanism (e.g., environment variable)
const GOOGLE_API_KEY = process.env.gemini;

// Error handling (consider a more robust error handling approach)
if (!GOOGLE_API_KEY) {
  throw new Error('Missing Google API key. Please set the GOOGLE_API_KEY environment variable.');
}

// Initialize chat history and model (outside the request handler for efficiency)
let chatHistory = [];

const { GoogleGenerativeAI } = require('@google/generative-ai'); // Assuming the correct package name

const genAI = new GoogleGenerativeAI(process.env.gemini);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });



async function continueConversation(prpt) {

  const prewrittenPrompts = [


    `
Write me a  Aeshop Fables (genre) with many short paragraphs. You are given a prompt for a story, and I want you to use that prompt as a starting point for a story that includes exposition and a challenge that is overcome. Exposition means writing about the physical traits and location of the main character. The story must be appropriate for children. No sex, death, dying, or anything scary. The story has to be at least 200 words. The story must have a happy ending.
      PROMPT: A cat who wants to be a flamingo
      STORY:
      Title: Flamingo Cat
      X
      There was once a cat who wanted to be a flamingo. The cat watched the flamingos for hours on end, mesmerized by their grace and beauty. One day, the cat decided to try to imitate the flamingos. The cat stretched its neck and flapped its arms, but it just couldn't quite manage to get the hang of it.
      The cat kept practicing, and eventually it became quite good at imitating the flamingos. The cat even managed to make its fur turn pink. The cat was so proud of itself that it strutted around the zoo, showing off its new skills to all the other animals.
      One day, a group of flamingos came to the zoo. When they saw the cat, they were so impressed that they asked it to join their flock. The cat was thrilled, and it immediately began following the flamingos around, trying to copy their every move.
      The cat was happy for a while, but eventually it started to miss its old life. The cat missed the feel of the grass beneath its paws and the taste of fresh fish. It missed napping in the sun and playing with its friends.
      One day, the cat made a decision. It said goodbye to the flamingos and went back to being a cat. The cat was happy to be itself again, but once in a while he stopped by the zoo to say hi to her flamingo friends.
      
      PROMPT: ${prpt}
      STORY:" `

  

  ];
  let lastResponse = null;

  // Use the existing chat history (no need to start a new chat)
  const chat = await model.startChat({ history: chatHistory });

  for (const prompt of prewrittenPrompts) {
    console.log(prompt);

    // Send pre-written prompt to the model within the existing chat
    const result = await chat.sendMessage(prompt);
    const response = await result.response;

    // Update the chat history within the existing chat
    chatHistory = chat.history;

    // Store the response
    lastResponse = response.text();
    console.log(lastResponse);
  }

  return lastResponse;
}

exports.promptGenerate = catchAsyncError(async (req, res, next) => {
  // Continue the conversation based on pre-written prompts
  const prpt = req.body.prompt;

  const data_to_pass_in = prpt;
  console.log('Data sent to python script:', data_to_pass_in);
  const python_process = spawner('python', ['./controller/python.py', data_to_pass_in]);
  python_process.stdout.on('data', (data)=>{
  console.log('Data received from python script:', data.toString());
  res.status(200).json({ success: data.toString() });
  });
// const lastResponse = await continueConversation(prpt);
// console.log(lastResponse);

// res.status(200).json({ success: data });
});

exports.diffusionGenerate = catchAsyncError(async (req,res,next)=>{
  const prpt = req.body.story;
  const data_to_pass_in=prpt;
  console.log('Data sent to python script:', data_to_pass_in);
  const python_process = spawner('python', ['./controller/diffusion.py', data_to_pass_in]);
  python_process.stdout.on('data', (data)=>{
  console.log('Data received from python script:', data.toString());
  res.status(200).json({ success: data.toString() });
  });
})

async function storyGeneration(prpt) {

  const prewrittenPrompts = [
    "'A brave mouse who dreams of being a knight.','A magical journey awaits when a clumsy bear discovers the power of flight.','A brave mouse embarks on a magical adventure to find the mysterious Rainbow Valley.','A magical dragon who flies to school each day.','A strange journey begins when a young kangaroo discovers a magical portal.'  Here are some of the prompt a user will write to a ai bot to create a story about these.if i was the user and i wanted to write something like this lines but i want you to help me generate something like this lines what would be the prompt i would give you so that you would generate me a line some thing like these lines,detect the hard words from the prompt and use easier words to replace those hard words which will be understood by the children of age 4 to 6 years old.Also you need to include characters name from Bangladesh and also the the background scenario will also be from Bangladesh. Now give me only any single line that i will directly use as my prompt don't give anything except a single line"
  ];
  let lastResponse = null;

  // Use the existing chat history (no need to start a new chat)
  const chat = await model.startChat({ history: chatHistory });

  for (const prompt of prewrittenPrompts) {
    console.log(prompt);

    // Send pre-written prompt to the model within the existing chat
    const result = await chat.sendMessage(prompt);
    const response = await result.response;

    // Update the chat history within the existing chat
    chatHistory = chat.history;

    // Store the response
    lastResponse = response.text();
    console.log(lastResponse);
  }

  return lastResponse;
}


exports.sotryBeginingFromUser = catchAsyncError(async (req, res, next) => {

  const lastResponse = await storyGeneration();

  res.status(200).json({ story: lastResponse });
});



exports.storyLines = catchAsyncError(async (req, res, next) => {
  // Get the title and id from the request body
  const { title, id } = req.body;

  // Define the path to the text file
  const filePath = path.join(__dirname, `../../FrontEnd/public/story/user/${title}/lines/${id}.txt`);

  // Read the content of the text file
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      return res.status(500).json({ error: 'Error reading file' });
    }

    // Send the file content as a response
    res.status(200).json({ title, id, fileContent: data });
  });
});
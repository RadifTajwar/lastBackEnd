const express = require('express');
const sdk = require("microsoft-cognitiveservices-speech-sdk");
const fs = require('fs');
const axios = require('axios');
const catchAsyncError = require('../middleware/catchAsyncError');
// Replace with your actual API key fetching mechanism (e.g., environment variable)
const GOOGLE_API_KEY = process.env.gemini;

// Error handling (consider a more robust error handling approach)
if (!GOOGLE_API_KEY) {
    throw new Error('Missing Google API key. Please set the GOOGLE_API_KEY environment variable.');
}

// Initialize chat history and model (outside the request handler for efficiency)
let chatHistory = [];

const { GoogleGenerativeAI } = require('@google/generative-ai'); // Assuming the correct package name
const { title } = require('process');

const genAI = new GoogleGenerativeAI(process.env.gemini);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

exports.voiceGenerate = catchAsyncError(async (req, res, next) => {
    // Assuming the text is sent in the request body under a key named 'text'
    const text = req.body.text;
    const voiceId = req.body.voiceId;
    const storyTitle = req.body.title;
    if (!text) {
        return res.status(400).json({ error: 'Text is required in the request body' });
    }

    // Directory where audio files will be saved
    const directory = `../FrontEnd/public/story/user/${storyTitle}/speeches`;
    
    const filePath = `../FrontEnd/public/story/user/${storyTitle}/lines`;

    if (!fs.existsSync(filePath)) {
        fs.mkdirSync(filePath, { recursive: true });
    }
    var lineFile = `${filePath}/${voiceId}.txt`;
    fs.writeFile(lineFile, text, (err) => {
        if (err) {
          console.error('Error writing file:', err);
          // Handle error
        } else {
          console.log('Text saved to file:', lineFile);
          // File saved successfully
        }
      });


    // Ensure the directory exists, create it if it doesn't
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
    }

    var audioFile = `${directory}/${voiceId}.wav`;
    // This example requires environment variables named "SPEECH_KEY" and "SPEECH_REGION"
    const speechConfig = sdk.SpeechConfig.fromSubscription(process.env.speech_subscription_key, process.env.speech_region);
    const audioConfig = sdk.AudioConfig.fromAudioFileOutput(audioFile);

    // The language of the voice that speaks.
    speechConfig.speechSynthesisVoiceName = "en-US-AndrewMultilingualNeural";

    // Create the speech synthesizer.
    var synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

    // Start the synthesizer and wait for a result.
    synthesizer.speakTextAsync(text,
        function (result) {
            if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
                console.log("Synthesis finished.");
                res.status(200).json({ success: '200' });
            } else {
                console.error("Speech synthesis canceled, " + result.errorDetails +
                    "\nDid you set the speech resource key and region values?");
            }
            synthesizer.close();
            synthesizer = null;
        },
        function (err) {
            console.trace("Error - " + err);
            synthesizer.close();
            synthesizer = null;
        });

    console.log("Now synthesizing to: " + audioFile);

});


async function imagePromptGeneration(prpt) {

    const prewrittenPrompts = [
        ` "${prpt}"

         one single string explain what the character doing . If the character is holding or doing something with his arms or legs or tail or head how they are doing it? give the result in a string named "prompt" and give the string in this format "prompt"="prompt_text"`
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

exports.imageGenerate = catchAsyncError(async (req, res, next) => {
    const story = req.body.story;
    const text = req.body.text;
    const id = req.body.id;
    const storyTitle=req.body.title;
    if (!text) {
        return res.status(400).json({ error: 'Text is required in the request body' });
    }

    // const reply = await imagePromptGeneration(text);
    const reply = text;
    console.log(reply);
   
   
  

    const prompt = `${reply}, shot 35 mm, realism, octane render, 8k, trending on artstation, 35 mm camera, unreal engine, hyper detailed, photo - realistic maximum detail, volumetric light, realistic matte painting, hyper photorealistic, trending on artstation, ultra - detailed, realistic`
    


    const requestBody = {
        prompt: prompt,
        steps: 50
    };

    // Make a POST request to localhost:7860
    try {
        const response = await axios.post('http://localhost:7860/sdapi/v1/txt2img', requestBody);
        const base64Image = response.data.images[0];
        const imageData = Buffer.from(base64Image, 'base64');
        const directory = `../FrontEnd/public/story/user/${storyTitle}/images`;

        // Ensure the directory exists, create it if it doesn't
        if (!fs.existsSync(directory)) {
            fs.mkdirSync(directory, { recursive: true });
        }

        var fileName = `${directory}/${id}.jpg`;

        fs.writeFile(fileName, imageData, 'binary', (err) => {
            if (err) {
                console.error('Error saving image:', err);
                res.status(500).json({ error: 'Error saving image' });
            } else {
                console.log('Image saved successfully:', fileName);
                res.status(200).json({ success: '200', fileName: fileName });
            }
        });
    } catch (error) {
        console.error('Error making POST request to localhost:7860:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
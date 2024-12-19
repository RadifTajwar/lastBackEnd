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




async function continueConversation(prpt, style) {
  const prompts = {
    classic: {
      story: `Title: Flamingo Cat
      1)There was once a cat who wanted to be a flamingo. The cat watched the 
      flamingos for hours on end, mesmerized by their grace and beauty. One day, 
      the cat decided to try to imitate the flamingos. The cat stretched its neck 
      and flapped its arms, but it just couldn't quite manage to get the hang of it.
      2)The cat kept practicing, and eventually it became quite good at imitating the 
      flamingos. The cat even managed to make its fur turn pink. The cat was so 
      proud of itself that it strutted around the zoo, showing off its new skills 
      to all the other animals.
      3)One day, a group of flamingos came to the zoo. When they saw the cat, they 
      were so impressed that they asked it to join their flock. The cat was thrilled, 
      and it immediately began following the flamingos around, trying to copy their 
      every move
      4)The cat was happy for a while, but eventually it started to miss its old life. 
      The cat missed the feel of the grass beneath its paws and the taste of fresh 
      fish. It missed napping in the sun and playing with its friends.
      5)One day, the cat made a decision. It said goodbye to the flamingos and went 
      back to being a cat. The cat was happy to be itself again, but once in a while 
      he stopped by the zoo to say hi to her flamingo friends.`,
      prompt: `Write me a Aesop's Fable (genre) with many short paragraphs of at most 20 words each paragraph 
      And there will be at most 7 paragraphs and number each of the paragraph
      The story has to be at least 120 words but not more than 150. As the story is being written in Bangladesh add one of the most historical place names in the story and add Bengali culture in the story.
      Remember do not use any uncommon words in the story as this story will be read by the children of age 4 to 6 years old.
      You are given a prompt for a story, and I want you to use that 
      prompt as a starting point for a story that includes exposition 
      and a challenge that is overcome. Exposition means writing about 
      the physical traits and location of the main character. The story 
      must be appropriate for children. No sex, death, dying, or anything 
      scary. Do not use any conversation among the characters as the story should be viewed from a third person angle.
      Words. And make sure the story is written in Aesop's Fable style. Here is an Example:
      PROMPT: A cat who wants to be a flamingo`,
    },
    fairyTale: {
      story: `Title: The Genie and His Three Magical Wishes
      1)In the ancient city of Sonargaon, a poor boy named Amir found a dusty old lamp while playing near the river.
      
      2)When Amir rubbed the lamp, a genie appeared. The genie, grateful for his freedom, granted Amir three magical wishes.
      
      3)Amir's first wish was for food for his village. The genie filled every home with rice, fish, and sweet pithas.
      
      4)For his second wish, Amir asked for a school. The genie built a beautiful school where children could learn and play.
      
      5)An evil sorcerer heard about the genie and tried to steal the lamp. Amir bravely hid it in a secret place.
      
      6)For his final wish, Amir asked for peace in Sonargaon. The genie made sure the sorcerer was never seen again.
      
      7)The village celebrated with music, dance, and laughter. Amir's kindness and bravery made Sonargaon a happy place forever.`,
      prompt: `Write me a fairy tale with many short paragraphs of at most 20 words each paragraph. There will be at most 7 paragraphs and number each of the paragraphs. The story has to be at least 120 words but not more than 150. As the story is being written in Bangladesh, add one of the most historical place names in the story and incorporate elements of Bengali culture. Remember to use simple words suitable for children aged 4 to 6 years old. The story should include a magical setting, good and evil characters, and a happy ending. It is important for you to add some magical touch to the story something that is impossible in real. Here is an Example:
      PROMPT: A magical genie of lamp who grants wishes`,
    },
    sciFi: {
      story: `Title: The Boy Who Fixed the Spaceship
      1)Once upon a time, a young boy named Alex wandered into the vast, sandy desert near his hometown." 
        2)As he walked, he stumbled upon a strange, metallic object half-buried in the sand. 
        3)Alex brushed off the sand and realized it was a broken spaceship with alien symbols on it.
        4)Curious and excited, Alex decided to investigate further and found a small hatch.
        5)Inside, he discovered a group of aliens who looked worried and helpless.
        6)Using his knowledge of mechanics, Alex offered to help them fix their ship.
        7)He worked tirelessly, using tools and parts he found around the crash site.
        8)Finally, after hours of hard work, the spaceship was ready to fly again.
        9)The aliens thanked Alex profusely and invited him to travel with them, but he decided to stay home.
        10)As the spaceship lifted off, Alex waved goodbye, feeling proud of his adventure.`,
      prompt: `Write me a science fiction story with many short paragraphs of at most 20 words each paragraph. There will be at most 7 paragraphs and number each of the paragraphs. The story has to be at least 120 words but not more than 150. Remember to use simple words suitable for children aged 4 to 6 years old. The story should include a futuristic setting, friendly and evil aliens, and a happy ending. Here is an Example:
      PROMPT: A child who helps an alien repair their spaceship`,
    },
  };

  const selectedPrompt = prompts[style];

  if (!selectedPrompt) {
    throw new Error('Invalid style selected');
  }

  const prewrittenPrompts = [
    `
    ${selectedPrompt.prompt}
    STORY:"
    ${selectedPrompt.story}
    "
    PROMPT:${prpt}. 
    STORY: 
    Now generate the Story according to the prompt:${prpt}.Remember to give a happy ending on the story. Make sure you maintain the above format and title of the STORY and make sure you numbered all the lines.`

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
  const style = req.body.style;
  const lastResponse = await continueConversation(prpt, style);
  res.status(200).json({ success: lastResponse });

  // const lastResponse = await continueConversation(prpt);
  // console.log(lastResponse);

  // res.status(200).json({ success: data });
});

async function diffusionGeneration(prpt, style) {
  const fairyTalePrompt = ` Here is an exmaple of what the example scene could be associated with an example story .
  "1)In the ancient city of Sonargaon, a poor boy named Amir found a dusty old lamp while playing near the river.
  2)When Amir rubbed the lamp, a genie appeared. The genie, grateful for his freedom, granted Amir three magical wishes.
  3)Amir's first wish was for food for his village. The genie filled every home with rice, fish, and sweet pithas.
  4)For his second wish, Amir asked for a school. The genie built a beautiful school where children could learn and play.
  5)An evil sorcerer heard about the genie and tried to steal the lamp. Amir bravely hid it in a secret place.
  6)For his final wish, Amir asked for peace in Sonargaon. The genie made sure the sorcerer was never seen again.
  7)The village celebrated with music, dance, and laughter. Amir's kindness and bravery made Sonargaon a happy place forever.
  "
  And here is an example scene for the story. Here one thing to notice that where the character is dreaming, imagining , realizing or doing any other activity that doesn't represent the scene i have focused on making the scenic of what he is dreaming , imagining or realizing about so that the scenes becomes associated with the story.

  "
  1)A poor boy finding a dusty old lamp while playing by the river in the ancient city of Sonargaon at sunset, with the river and ancient buildings in the background.2)A genie appearing from a lamp, with magical light swirling around, by the riverbank in Sonargaon, with lush greenery and ancient buildings in the distance.3)Homes in Sonargaon filled with rice, fish, and sweet pithas, with villagers joyfully receiving the food against a backdrop of traditional houses.4)A beautiful school being built by the genie in Sonargaon, with children learning and playing in a courtyard surrounded by vibrant flowers and trees.5)An evil sorcerer sneaking around the village of Sonargaon, trying to steal the lamp, while the poor boy hides it in ancient ruins.6)The genie ensuring peace in Sonargaon by making the sorcerer disappear, with the village appearing serene and safe under a clear blue sky.7)The village of Sonargaon celebrating with music, dance, and laughter, with colorful decorations, lanterns, and ancient architecture in the background.
  "
  Here is an example of what the scene could be.In the next prompt i will give you a story for which you will need to create the output scenes. Just keep this example in your knowledge which will help you to go through the process of creating output
  `

  const sciFiPrompt = `Here is an example of what the example scene could be associated with an example story .
  "1)Once upon a time, a young boy named Alex wandered into the vast, sandy desert near his hometown." 
  2)As he walked, he stumbled upon a strange, metallic object half-buried in the sand. 
  3)Alex brushed off the sand and realized it was a broken spaceship with alien symbols on it.4)Curious and excited, Alex decided to investigate further and found a small hatch.
  5)Inside, he discovered a group of aliens who looked worried and helpless.6)Using his knowledge of mechanics, Alex offered to help them fix their ship.
  7)He worked tirelessly, using tools and parts he found around the crash site.8)Gradually, the spaceship started to look more functional, and the aliens watched with hopeful eyes.9)Finally, after hours of hard work, the spaceship was ready to fly again.10)The aliens thanked Alex profusely and invited him to travel with them, but he decided to stay home.11)As the spaceship lifted off, Alex waved goodbye, feeling proud of his adventure.12)He returned to his hometown, with a fantastic story to tell and a heart full of dreams." And here is an example scene for the story. Here one thing to notice that where the character is dreaming, imagining , realizing or doing any other activity that doesn't represent the scene i have focused on making the scenic of what he is dreaming , imagining or realizing about so that the scenes becomes associated with the story."1)A young boy named Alex walking through a vast, sandy desert under a clear blue sky.2)A young boy discovering a strange, metallic object half-buried in the desert sand.3)A young boy brushing sand off a broken spaceship with alien symbols.4)A young boy investigating a broken spaceship and finding a small hatch.5)A young boy discovering a group of worried and helpless aliens inside a broken spaceship.6)A young boy offering to help fix a broken spaceship using his mechanical knowledge.7)A young boy working tirelessly with tools and parts to fix a broken spaceship in the desert.8)A boy repairing a spaceship as hopeful aliens watch him in the desert.9)A repaired spaceship ready to fly again in the desert, with a young boy and grateful aliens beside it.10)Grateful aliens thanking a young boy and inviting him to travel with them, but the boy deciding to stay home.11)A young boy waving goodbye as a spaceship lifts off into the sky, feeling proud of his adventure.12)A young boy returning to his hometown from the desert, with a fantastic story to tell and a heart full of dreams." Here is an example of what the scene could be.In the next prompt i will give you a story for which you will need to create the output scenes. Just keep this example in your knowledge which will help you to go through the process of creating output`
  const classicPrompt = `Here is an example of what the example scene could be associated with an example story .
  "1)In the lush greenery of Sundarbans, a playful fox roamed, curious and lively." 
  2)One day, the fox heard a rumor of hidden treasure buried beneath an ancient banyan tree. 
  3)Excited, the fox embarked on a quest, digging eagerly beneath the sprawling roots.4)Days turned to weeks, but the treasure remained elusive, teasingly hidden from view.
  5)Undeterred, the fox persevered, fueled by dreams of riches beyond imagination.6)Finally, beneath a pile of moss-covered stones, the fox uncovered a glimmering gem.
  7)But as it held the treasure aloft, a voice whispered, \"True wealth lies in friendship.\"8)With newfound wisdom, the fox abandoned the gem, cherishing the camaraderie of the forest instead."And here is an example scene for the story. Here one thing to notice that where the character is dreaming, imagining , realizing or doing any other activity that doesn't represent the scene i have focused on making the scenic of what he is dreaming , imagining or realizing about so that the scenes becomes associated with the story."1) A playful fox of reddish fur with a jolly and playful look, pouncing through the lush green of the Sundarbans at sunrise2) A majestic ancient banyan tree in the heart of the Sundarbans forest, in the warm glow of the rising sun3) A fox of reddish fur ,with a aggressive expression digging muds furiously with its claws inside a hole beneath the sprawling roots of a majestic ancient banyan tree in the Sundarbans4) Treasure in a treasure box inside an ancient banyan tree, golden dust of light , Golden radiance glowing from the treasure on the treasure box5) A fox of reddish fur ,dreaming of sitting beside a treasure box , rich fox, gold chains swinging around the fox's neck, golden dust of light , Golden radiance glowing from the treasure on the treasure box6) A glimmering gemstone ,beneath a pile of moss covered stones, crystallized , blue dust of light , bluish radiance glowing from the stone7) A glimmering gemstone , placed inside mouth of a fox with reddish r and the fox is holding that gemstone with its teeth inside its mouth , blue dust of light , bluish radiance glowing from the fox mouth, beneath an ancient banyan tree8) A glimmering gemstone , crystalized , blue dust of light , bluish radiance glowing from that stone, a fox of reddish standing back , the fox far beneath an ancient banyan tree." Here is an example of what the scene could be.In the next prompt i will give you a story for which you will need to create the output scenes. Just keep this example in your knowledge which will help you to go through the process of creating output`
  let stylePrompt;
  if (style === "classic" ) {
    stylePrompt = classicPrompt;
  } else if (style === "sciFi") {
    stylePrompt = sciFiPrompt;
  } else if( style === "fairyTale"){
    stylePrompt = fairyTalePrompt; // handle other cases if necessary
  }
  const prewrittenPrompts = [

    `${stylePrompt}`
    ,
    `Take the following INPUT and for each item in the list return the structure [CHARACTER ACTION in LOCATION]. If you can't figure out the location, you can make it up.Be a little more productive about the lights on the and scenario of the background of the image. Replace any character name with its species name. Give the result OUTPUT2 below 
INPUT1:

        "1)Once upon a time, a young boy named Alex wandered into the vast, sandy desert near his hometown." 
        2)As he walked, he stumbled upon a strange, metallic object half-buried in the sand. 
        3)Alex brushed off the sand and realized it was a broken spaceship with alien symbols on it.
        4)Curious and excited, Alex decided to investigate further and found a small hatch.
        5)Inside, he discovered a group of aliens who looked worried and helpless.
        6)Using his knowledge of mechanics, Alex offered to help them fix their ship.
        7)He worked tirelessly, using tools and parts he found around the crash site.
        8)Finally, after hours of hard work, the spaceship was ready to fly again.
        9)The aliens thanked Alex profusely and invited him to travel with them, but he decided to stay home.
        10)As the spaceship lifted off, Alex waved goodbye, feeling proud of his adventure.
  
OUTPUT1:
1)A young boy named Alex walking through a vast, sandy desert under a clear blue sky.
2)A young boy discovering a strange, metallic object half-buried in the desert sand.
3)A young boy brushing sand off a broken spaceship with alien symbols.
4)A young boy investigating a broken spaceship and finding a small hatch.
5)A young boy discovering a group of worried and helpless aliens inside a broken spaceship.
6)A young boy offering to help fix a broken spaceship using his mechanical knowledge.
7)A young boy working tirelessly with tools and parts to fix a broken spaceship in the desert.
8)A repaired spaceship ready to fly again in the desert, with a young boy and grateful aliens beside it.
9)Grateful aliens thanking a young boy and inviting him to travel with them, but the boy deciding to stay home.
10)A young boy waving goodbye as a spaceship lifts off into the sky, feeling proud of his adventure.

Input2: ${prpt}
Output2
make sure all the lines are presented in the OUTPUT2 as in the INPUT2.Do not focus on only one character , Rather focus on every character about what they are doing in each line.Always speak about the background and place.I will create text to image from the Ouput2 using each line . You can take help in thinking how the scenes could be from the example i had given you from the previous prompt.Remember while generating each scene from the line the scene represents that exact line not their past nor their future tense. Remember not to use any name of character just use the species name (eg:"for this line  'Lily running around her backyard' you will be creating ' A young girl named Lily running in her backyard'" ) .Take a good look that you have given me all the lines in Output2 as Input2.Now just give me the Output2 for the Input2`,


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

exports.diffusionGenerate = catchAsyncError(async (req, res, next) => {
  const prpt = req.body.story;
  const style = req.body.style;
  const lastResponse = await diffusionGeneration(prpt, style);
  res.status(200).json({ success: lastResponse });
});


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
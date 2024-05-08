import asyncio
import sys

from g4f.client import Client

asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
input =sys.argv[1]

data_to_pass_back ="send this to node process."
output=data_to_pass_back

client = Client()
msg = (
    "Write me a  Aeshop Fables (genre) with many short paragraphs of at most 20 words each paragraph "
    "And there will be at most 7 paragraphs and number each of the paragraph"
    " The story has to be at least 120 words but not more than 150 . As the story is being written in Bangladesh add one of  the most historical place names in the story and add Bengali culture in the story ."
    " Remember do not use any uncommon words in the story as this story will be read by the children of age 4 to 6 years old"
    "You are given a prompt for a story, and I want you to use that "
    "prompt as a starting point for a story that includes exposition "
    "and a challenge that is overcome. Exposition means writing about "
    "the physical traits and location of the main character. The story "
    "must be appropriate for children. No sex, death, dying, or anything "
    "scary.Do not use any conversation among the characters as the story should be viewed from a third person angle."
    "words. Add a twist in the story that the viewer become amoused to see . And make sure the story is written in Aeshops Fable style"
    "PROMPT: A cat who wants to be a flamingo"
    "STORY:"
    "Title: Flamingo Cat"
    "1)There was once a cat who wanted to be a flamingo. The cat watched the "
    "flamingos for hours on end, mesmerized by their grace and beauty. One day, "
    "the cat decided to try to imitate the flamingos. The cat stretched its neck "
    "and flapped its arms, but it just couldn't quite manage to get the hang of it."
    "2)The cat kept practicing, and eventually it became quite good at imitating the "
    "flamingos. The cat even managed to make its fur turn pink. The cat was so "
    "proud of itself that it strutted around the zoo, showing off its new skills "
    "to all the other animals."
    "3)One day, a group of flamingos came to the zoo. When they saw the cat, they "
    "were so impressed that they asked it to join their flock. The cat was thrilled, "
    "and it immediately began following the flamingos around, trying to copy their "
    "every move."
    "4)The cat was happy for a while, but eventually it started to miss its old life. "
    "The cat missed the feel of the grass beneath its paws and the taste of fresh "
    "fish. It missed napping in the sun and playing with its friends."
    "5)One day, the cat made a decision. It said goodbye to the flamingos and went "
    "back to being a cat. The cat was happy to be itself again, but once in a while "
    "he stopped by the zoo to say hi to her flamingo friends."
   f"PROMPT:{input}. "
    "STORY: "
   
    
)
response = client.chat.completions.create(
    model="gpt-3.5-turbo",
    messages=[{"role": "user", "content": msg}],
  
)
print(response.choices[0].message.content)

sys.stdout.flush()
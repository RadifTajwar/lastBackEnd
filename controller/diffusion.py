
import asyncio
import sys

from g4f.client import Client

asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
input =sys.argv[1]

data_to_pass_back ="send this to node process."
output=data_to_pass_back

client = Client()
msg = (
    "Take the following INPUT and for each item in the list return the structure [CHARACTER ACTION in LOCATION]. If you can't figure out the location, you can make it up.Be a little more productive about the lights on the and scenario of the background of the image. Replace any character name with its species name. Give the result OUTPUT2 below  "
"INPUT1:"

        "1. A cheetah who lived in the African savanna dreamed of living in the Big Apple. She had seen pictures of the city and it looked like a place where she could really spread her wings and strut her stuff. So, she set off on a journey to find New York City."
        "2. On the way, she encountered many challenges. She had to cross a vast desert and then a raging river. But she used her speed and agility to run around these obstacles."
        "3. Finally, she arrived in New York City. But she quickly realized that it wasn't quite what she had dreamed it would be. The concrete jungle was noisy and crowded. There didn't seem to be any room for her to run and play. So the cheetah hid."
        "4. But the cheetah was not a quitter. She decided to make the best of it and soon found a cozy spot in Central Park where she could watch the hustle and bustle of the city and dream of the day when she could finally run free."
"OUTPUT1:"
"1)Cheetah dreaming in New York City"
"2)Cheetah running in vast desert and raging river"
"3)Cheetah hiding in New York City"
"4)Cheetah watching in cozy spot in Central Park"
f"Input2:{input}"
"Output2"
"make sure all the lines are presented in the OUTPUT2 as in the INPUT2"
)
response = client.chat.completions.create(
    model="gpt-3.5-turbo",
    messages=[{"role": "user", "content": msg}],
  
)
print(response.choices[0].message.content)

sys.stdout.flush()
import requests

response = requests.post(url="http://127.0.0.1:3333/get_question_paper" )


print(response.json())
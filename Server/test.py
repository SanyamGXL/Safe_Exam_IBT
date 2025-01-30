import requests

student_json = {
    "student_id" : "sam",
    "start_time" :"-"
}


response = requests.post(url="http://127.0.0.1:3333//write_to_blockchain" , json=student_json)

print(response.text)




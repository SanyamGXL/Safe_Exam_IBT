from Blockchain.Create_Blockchain_object import Blockchain

user_obj = Blockchain(user_id="Sanyam" , user_already_exist=False , user_json_data=None)


print(user_obj.get_generated_user_details())
import base64
import algokit_utils
from algosdk import account, mnemonic, transaction
from algosdk.transaction import Multisig , MultisigTransaction

# Assuming we will run the run.py file from server folder hence the current working directory will become "Safe_Exam_IBT\Server"
from Blockchain.artifact_file import HelloWorldClient
from Metadata import Blockchain_Metadata


class Blockchain_Obj:


    def __init__(self , user_id ,user_already_exist = False , user_json_data = None ):
        
        ########################################################################
        # Create the client
        
        self.algod_client = Blockchain_Metadata.Algod_Client
        self.indexer_client = Blockchain_Metadata.Indexer_Client

        ########################################################################
        
        # Master wallet address to fund account and also for signing the multisign transaction
        self.master_private_key = mnemonic.to_private_key(
            Blockchain_Metadata.master_Wallet_mnemonic
        )
        self.master_addr = account.address_from_private_key(self.master_private_key)

        ################################################################################
        # User Initialization
        self.UserID = user_id

        # If user does not exists
        if not user_already_exist:
            # User's data (User is the deployer of app)
            self.private_key , self.address = self.generate_account()
            self.new_mnemonic = mnemonic.from_private_key(self.private_key)
            self.deployer = algokit_utils.get_account_from_mnemonic(self.new_mnemonic)
            self.__fund_account(address_to_be_funded=self.deployer.address)
            self.app_client , self.deployed_app = self.deploy_app()

        else:
            # Check if the json data of already existing user is provided or not
            if user_json_data:
                self.private_key , self.address = user_json_data['user_private_key'] , user_json_data['user_wallet_address']
                self.new_mnemonic = mnemonic.from_private_key(self.private_key)
                self.deployer = algokit_utils.get_account_from_mnemonic(self.new_mnemonic)
                self.app_client = HelloWorldClient(
                self.algod_client, creator=self.deployer, indexer_client=self.indexer_client
                )
                self.deployed_app = user_json_data['app_id']
            else:
                print("User Json Data not provided !!!")

        ########################################################################
        
        # Multisig setup
        # threshold = 2 # Minimum 2 signatures are required

        # public_keys = [self.master_addr , self.deployer.address]

        # self.multisig = Multisig(
        #     version=1,
        #     threshold=threshold,
        #     addresses=public_keys
        # )

        # self.multisig_address = self.multisig.address()

        # self.__fund_account(address_to_be_funded=self.multisig_address)

        ########################################################################

    @staticmethod
    def generate_account():
        private_key,wallet_address = account.generate_account()
        return (private_key , wallet_address)

    def sign_multisign_transaction(self):
        try:
            # Dummy payment transaction for simulating multisign transaction

            dummy_account_private_key , dummy_account_wallet_address  = self.generate_account()
            

            txn = transaction.PaymentTxn(
                sender=self.multisig_address,
                sp=self.algod_client.suggested_params(),
                receiver=dummy_account_wallet_address,
                amt=0
            )

            multisign_txn = MultisigTransaction(txn , multisig=self.multisig)

            # Sign the multisign transaction

            multisign_txn.sign(private_key=self.master_private_key)
            multisign_txn.sign(private_key=self.deployer.private_key)

            txid = self.algod_client.send_transaction(multisign_txn)
            transaction.wait_for_confirmation(algod_client=self.algod_client ,txid=txid )
            print("Multisign transaction Completed !!! :-" , txid)

            return 1
        
        except Exception as e:
            print("Error performing multisign transaction ")
            print(str(e))

            return -1





    def __fund_account(self , address_to_be_funded):
        # Funded Account
        self.amount_microalgos = int(1 * 1e6)
        self.suggested_params = self.algod_client.suggested_params()
        self.txn = transaction.PaymentTxn(
            sender=self.master_addr,
            receiver=address_to_be_funded,
            amt=self.amount_microalgos,
            sp=self.suggested_params,
        )
        self.signed_txn = self.txn.sign(self.master_private_key)
        self.txid = self.algod_client.send_transaction(self.signed_txn)
        print(f"Account {self.deployer.address} Funded !!!!")



    def deploy_app(self):

        app_client = HelloWorldClient(
            self.algod_client, creator=self.deployer, indexer_client=self.indexer_client
        )

        app_client.deploy(
            on_schema_break=algokit_utils.OnSchemaBreak.AppendApp,
            on_update=algokit_utils.OnUpdate.AppendApp,
        )
        

        print(
            f" APP deployed at :- {app_client.app_id}"
        )
        return app_client , app_client.app_id
    

    def deploy_data(
        self,
        student_id,
        exam_title,
        city,
        center_name,
        booklet,
        start_time,
        que_ans,
        suspicious_activity_detected,
        end_time,
        user_mnemonic,
    ):
        try:
            deployer = algokit_utils.get_account_from_mnemonic(user_mnemonic)

            app_client = HelloWorldClient(
            self.algod_client, creator=deployer, indexer_client=self.indexer_client
        )
            response = app_client.quiz_data(
                student_id=f"{student_id}",
                exam_title=exam_title,
                city=city,
                center_name=center_name,
                booklet=booklet,
                start_time=start_time,
                end_time=end_time,
                que_ans=que_ans,
                suspicious_activity_detected=suspicious_activity_detected,
                wallet_address=deployer.address,
            )

            transaction_id = response.tx_id
            sender_wallet = response.tx_info["txn"]["txn"]["snd"]


            # if "yes" in str(suspicious_activity_detected):

            #     print(f"!!! Malicicous activity Transaction !!!:- https://app.dappflow.org/explorer/transaction/{transaction_id}")
            # else:
                # print(f"Exam Transaction :- https://app.dappflow.org/explorer/transaction/{transaction_id}")
            print(f"Exam Transaction :- https://lora.algokit.io/testnet/transaction/{transaction_id}")
            return transaction_id, sender_wallet
        except Exception as e :
            print("Error writing data to blockchain !!!" , e)
            return -1 , -1 


    def get_all_transactions(self, wallet_address, appId):
        print(f"Getting all transactions for {wallet_address} - in App:- {appId}")
        self.response = self.indexer_client.search_transactions(
            address=wallet_address, application_id=appId
        )
        all_transactions = self.response["transactions"]

        for single_transaction in all_transactions:
            if "global-state-delta" in single_transaction:
                global_state_delta = single_transaction["global-state-delta"]
                for single_delta in global_state_delta:
                    print(single_delta)
                    attribute = single_delta["key"]
                    value = single_delta["value"]["bytes"]
                    print(
                        f"Attribute:- {base64.b64decode(attribute).decode('utf-8')} ||| Value:-  {base64.b64decode(value).decode('utf-8')}"
                    )
                print("-" * 64)


    def get_crash_exam_details(self,  application_id):
        """
        This functions checks if software crashed while user was giving exam and returns the question index number
        where the user left the exam.
        """
        try:

            max_index = 0
            # We are picking wallet address and appid from deploy locale file which is imported in this folder
            question_answer_data = {}
            response = self.indexer_client.search_transactions(
                application_id=application_id
            )

            all_transactions = response["transactions"]

            for single_transaction in all_transactions:
                if "global-state-delta" in single_transaction:
                    global_state_delta = single_transaction["global-state-delta"]
                    for single_delta in global_state_delta:
                        try:
                            attribute = single_delta.get("key")
                            value = single_delta.get("value").get("bytes")
                            decoded_attribute = base64.b64decode(attribute).decode("utf-8")
                            decoded_value = base64.b64decode(value).decode("utf-8")
                            # print(f"{decoded_attribute} :- {decoded_value}")
                            # Since sequentially data is retrieved if user has selected multiple answer for same question traversing back and forth then
                            # The latest answer will be overwritten automatically
                            if (
                                decoded_attribute == "global_que_ans"
                                and value.strip() != "-"
                            ):
                                question_num, answer = decoded_value.strip().split("-")
                                if question_num.strip().isdigit():
                                    if not question_answer_data.get(question_num.strip()):
                                        question_answer_data[question_num.strip()] = (
                                            answer.strip()
                                        )
                        except:
                            continue
            if question_answer_data:
                # # IF using sorting on dictonary then we can use pop directly after sorting to get max index
                # question_answer_data_sorted = sorted(question_answer_data.items(), key=lambda item: item[0])
                # max_index = max(question_answer_data, key=lambda item: item[0])
                return question_answer_data
            else:
                return {}
        except Exception as e:
            print("Error in deploy file (testnet)" , e)


    def get_generated_user_details(self):
        return {
                "userID":self.UserID,
                "user_wallet_address" : self.deployer.address,
                "user_private_key" : self.deployer.private_key,
                "user_mnemonic" : self.new_mnemonic,
                "app_id" : self.deployed_app,
                # "master_wallet" :self.master_addr,
                # "mulsign_address" : self.multisig_address
            }
    
if __name__ == "__main__":
    user_obj = Blockchain_Obj(user_id="Sanyam" , user_already_exist=False , user_json_data=None)

import base64
import algokit_utils
from algosdk import account, mnemonic, transaction
from algosdk.transaction import Multisig, MultisigTransaction

# Assuming we will run the run.py file from server folder hence the current working directory will become "Safe_Exam_IBT\Server"
from Blockchain.artifact_file import HelloWorldClient
from Metadata import Blockchain_Metadata


class Blockchain_Obj:
    """
    Blockchain_Obj class manages user accounts, app deployment, and interactions with Algorand blockchain.
    It supports creating new users, funding accounts, deploying smart contracts, multisig transactions,
    and retrieving blockchain data related to exams.
    """

    def __init__(self, user_id, user_already_exist=False, user_json_data=None):
        """
        Initialize the Blockchain object for a user.

        Args:
            user_id (str): Unique ID of the user.
            user_already_exist (bool): Whether the user already exists on blockchain.
            user_json_data (dict, optional): JSON data for existing user containing private key, address, and app_id.
        """
        ########################################################################
        # Create blockchain clients
        self.algod_client = Blockchain_Metadata.Algod_Client
        self.indexer_client = Blockchain_Metadata.Indexer_Client
        ########################################################################
        
        # Master wallet setup for funding accounts and signing multisig transactions
        self.master_private_key = mnemonic.to_private_key(
            Blockchain_Metadata.master_Wallet_mnemonic
        )
        self.master_addr = account.address_from_private_key(self.master_private_key)
        ########################################################################
        
        # User Initialization
        self.UserID = user_id

        if not user_already_exist:
            # Create new user account
            self.private_key, self.address = self.generate_account()
            self.new_mnemonic = mnemonic.from_private_key(self.private_key)
            self.deployer = algokit_utils.get_account_from_mnemonic(self.new_mnemonic)
            self.__fund_account(address_to_be_funded=self.deployer.address)
            self.app_client, self.deployed_app = self.deploy_app()
        else:
            # Load existing user from provided JSON data
            if user_json_data:
                self.private_key, self.address = user_json_data['user_private_key'], user_json_data['user_wallet_address']
                self.new_mnemonic = mnemonic.from_private_key(self.private_key)
                self.deployer = algokit_utils.get_account_from_mnemonic(self.new_mnemonic)
                self.app_client = HelloWorldClient(
                    self.algod_client, creator=self.deployer, indexer_client=self.indexer_client
                )
                self.deployed_app = user_json_data['app_id']
            else:
                print("User Json Data not provided !!!")
        ########################################################################
        # Multisig setup (currently commented out)
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
        """
        Generate a new Algorand account.

        Returns:
            tuple: (private_key, wallet_address)
        """
        private_key, wallet_address = account.generate_account()
        return private_key, wallet_address

    def sign_multisign_transaction(self):
        """
        Sign a multisig transaction using master and deployer accounts.

        Returns:
            int: 1 if successful, -1 if failed.
        """
        try:
            # Dummy transaction to simulate multisig
            dummy_account_private_key, dummy_account_wallet_address = self.generate_account()

            txn = transaction.PaymentTxn(
                sender=self.multisig_address,
                sp=self.algod_client.suggested_params(),
                receiver=dummy_account_wallet_address,
                amt=0
            )

            multisign_txn = MultisigTransaction(txn, multisig=self.multisig)

            # Sign transaction with both keys
            multisign_txn.sign(private_key=self.master_private_key)
            multisign_txn.sign(private_key=self.deployer.private_key)

            txid = self.algod_client.send_transaction(multisign_txn)
            transaction.wait_for_confirmation(algod_client=self.algod_client, txid=txid)
            print("Multisign transaction Completed !!! :-", txid)

            return 1
        except Exception as e:
            print("Error performing multisign transaction")
            print(str(e))
            return -1

    def __fund_account(self, address_to_be_funded):
        """
        Fund a given Algorand account from the master account.

        Args:
            address_to_be_funded (str): Wallet address to fund.
        """
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
        """
        Deploy a HelloWorld smart contract application on Algorand.

        Returns:
            tuple: (app_client, app_id)
        """
        app_client = HelloWorldClient(
            self.algod_client, creator=self.deployer, indexer_client=self.indexer_client
        )

        app_client.deploy(
            on_schema_break=algokit_utils.OnSchemaBreak.AppendApp,
            on_update=algokit_utils.OnUpdate.AppendApp,
        )

        print(f"APP deployed at :- {app_client.app_id}")
        return app_client, app_client.app_id

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
        """
        Deploy exam-related data to the blockchain via smart contract.

        Args:
            student_id, exam_title, city, center_name, booklet, start_time, que_ans, suspicious_activity_detected, end_time, user_mnemonic
        Returns:
            tuple: (transaction_id, sender_wallet) or (-1, -1) if failed
        """
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

            print(f"Exam Transaction :- https://lora.algokit.io/testnet/transaction/{transaction_id}")
            return transaction_id, sender_wallet
        except Exception as e:
            print("Error writing data to blockchain !!!", e)
            return -1, -1

    def get_all_transactions(self, wallet_address, appId):
        """
        Fetch and print all transactions for a given wallet and application ID.

        Args:
            wallet_address (str): Wallet address to fetch transactions.
            appId (int): Application ID of the smart contract.
        """
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

    def get_crash_exam_details(self, application_id):
        """
        Check if software crashed during exam and return the last answered question index.

        Args:
            application_id (int): Application ID of the deployed smart contract.
        Returns:
            dict: question_number -> answer mapping
        """
        try:
            question_answer_data = {}
            response = self.indexer_client.search_transactions(application_id=application_id)
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

                            if decoded_attribute == "global_que_ans" and value.strip() != "-":
                                question_num, answer = decoded_value.strip().split("-")
                                if question_num.strip().isdigit():
                                    if not question_answer_data.get(question_num.strip()):
                                        question_answer_data[question_num.strip()] = answer.strip()
                        except:
                            continue
            return question_answer_data if question_answer_data else {}
        except Exception as e:
            print("Error in deploy file (testnet)", e)

    def get_generated_user_details(self):
        """
        Return the blockchain-related details of the generated user.

        Returns:
            dict: Contains userID, wallet address, private key, mnemonic, and app ID
        """
        return {
            "userID": self.UserID,
            "user_wallet_address": self.deployer.address,
            "user_private_key": self.deployer.private_key,
            "user_mnemonic": self.new_mnemonic,
            "app_id": self.deployed_app,
        }


if __name__ == "__main__":
    # Example usage: create new user and deploy app
    user_obj = Blockchain_Obj(user_id="Sanyam", user_already_exist=False, user_json_data=None)

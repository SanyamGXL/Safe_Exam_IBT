const baseUrl = "https://0dfe-2405-201-200a-f0a7-7d9b-a7eb-7b91-da7.ngrok-free.app/";

interface ApiEndpoints {
  LoginUrl: string;
  ExamMetadata: string;
  WriteBlockchain: string;
  SendRegistrationJson: string;
  SetupEXE: string;
}

export const API_URLS: ApiEndpoints = {
  LoginUrl: `${baseUrl}login`,
  ExamMetadata: `${baseUrl}get_exam_metadata`,
  WriteBlockchain: `${baseUrl}write_to_blockchain`,
  SendRegistrationJson:`${baseUrl}send_registration_json`,
  SetupEXE:`${baseUrl}send_setup_exe`
};

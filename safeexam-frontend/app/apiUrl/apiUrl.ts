const baseUrl = "https://e5d8-2405-201-200a-f0a7-60cf-76a9-4ec6-c16b.ngrok-free.app/";

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

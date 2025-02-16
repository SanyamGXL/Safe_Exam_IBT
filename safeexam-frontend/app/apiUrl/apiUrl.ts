// const baseUrl = "https://b734-2405-201-200a-f0a7-315e-244e-b529-1ffb.ngrok-free.app/";
const baseUrl = "http://127.0.0.1:3333/"
interface ApiEndpoints {
  LoginUrl: string;
  ExamMetadata: string;
  WriteBlockchain: string;
}

export const API_URLS: ApiEndpoints = {
  LoginUrl: `${baseUrl}login`,
  ExamMetadata: `${baseUrl}get_exam_metadata`,
  WriteBlockchain: `${baseUrl}write_to_blockchain`,
};

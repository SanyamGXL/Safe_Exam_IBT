let originalAlert: (message?: unknown) => void;
let originalConfirm: (message?: string) => boolean;
let originalPrompt: (message?: string, defaultValue?: string) => string | null;

export const enterFullScreen = () => {
    const elem = document.documentElement as HTMLElement & {
      mozRequestFullScreen?: () => void;
      webkitRequestFullscreen?: () => void;
      msRequestFullscreen?: () => void;
    };
  
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.mozRequestFullScreen) { 
      elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) { 
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { 
      elem.msRequestFullscreen();
    }
};

export const ensureFullScreen = () => {
    document.addEventListener("fullscreenchange", () => {
      if (!document.fullscreenElement) {
        enterFullScreen(); 
      }
      if (document.fullscreenElement) {
        disableNotifications(); 
      } else {
        enableNotifications();
      }
    });
};

const disableNotifications = () => {
    console.log("Notifications disabled in full-screen mode");
  
    originalAlert = window.alert;
    originalConfirm = window.confirm;
    originalPrompt = window.prompt;
  
    window.alert = () => {};
    window.confirm = () => false;
    window.prompt = () => null;
};

const enableNotifications = () => {
    console.log("Notifications enabled after exiting full-screen mode");
  
    if (originalAlert) window.alert = originalAlert;
    if (originalConfirm) window.confirm = originalConfirm;
    if (originalPrompt) window.prompt = originalPrompt;
};

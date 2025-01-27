import React from "react";
import Snackbar, { SnackbarOrigin } from "@mui/material/Snackbar";
import Alert, { AlertColor } from "@mui/material/Alert";

interface CustomSnackbarProps {
  open: boolean;
  onClose: () => void;
  message: string;
  severity?: AlertColor; // 'success' | 'info' | 'warning' | 'error'
  duration?: number;
  anchorOrigin?: SnackbarOrigin; // { vertical: "top" | "bottom"; horizontal: "left" | "center" | "right" }
}

const CustomSnackbar: React.FC<CustomSnackbarProps> = ({
  open,
  onClose,
  message,
  severity = "info",
  duration = 6000,
  anchorOrigin = { vertical: "top", horizontal: "right" },
}) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={duration}
      onClose={onClose}
      anchorOrigin={anchorOrigin}
    >
      <Alert onClose={onClose} severity={severity} variant="filled">
        {message}
      </Alert>
    </Snackbar>
  );
};

export default CustomSnackbar;

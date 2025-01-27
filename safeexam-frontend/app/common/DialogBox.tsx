import * as React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

export interface AlertDialogProps {
  open: boolean; 
  title: string; 
  content: string; 
  agreeText?: string; 
  disagreeText?: string;
  onAgree?: () => void; 
  onDisagree?: () => void;
  onClose: () => void; 
}

export default function AlertDialog({
  open,
  title,
  content,
  agreeText = "Agree",
  disagreeText = "Disagree",
  onAgree,
  onDisagree,
  onClose,
}: AlertDialogProps) {
  const handleAgree = () => {
    if (onAgree) onAgree();
    onClose();
  };

  const handleDisagree = () => {
    if (onDisagree) onDisagree();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">{content}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleDisagree}>{disagreeText}</Button>
        <Button onClick={handleAgree} autoFocus>
          {agreeText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

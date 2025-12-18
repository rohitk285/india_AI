import React, { useState, useContext } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import DeleteCustomerModal from "./DeleteCustomerModal";

const Navbar = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { logout } = useContext(AuthContext);

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  // Feedback modal state (for success/error messages)
  const [feedback, setFeedback] = useState({
    open: false,
    message: "",
    success: true,
  });
  const showFeedback = (message, success) =>
    setFeedback({ open: true, message, success });

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          backgroundColor: "#FFFFFF",
          color: "#000000",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          padding: 1,
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Typography
            variant="h3"
            sx={{
              cursor: "pointer",
              fontWeight: "bold",
              color: "#FF5722",
              fontFamily: "Bebas Neue",
            }}
            onClick={() => navigate("/")}
          >
            KHR
          </Typography>

          <Box>
            <Button
              onMouseEnter={handleMenuOpen}
              sx={{
                color: "#000",
                fontWeight: "bold",
                fontSize: "18px",
                textTransform: "none",
                marginRight: 2,
              }}
            >
              Retrieve
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              onMouseLeave={handleMenuClose}
            >
              {["By Upload Date", "By Customer Name", "By Customer ID"].map(
                (text, idx) => (
                  <MenuItem
                    key={idx}
                    onClick={() => {
                      handleMenuClose();
                      navigate(
                        text === "By Upload Date"
                          ? "/retrievedate"
                          : text === "By Customer Name"
                            ? "/retrieve-customer"
                            : "/retrieve-custid"
                      );
                    }}
                  >
                    {text}
                  </MenuItem>
                )
              )}
            </Menu>

            {["Upload Doc", "Upload Fingerprint", "Update", "Delete", "Logout"].map(
              (text) => (
                <Button
                  key={text}
                  onClick={() => {
                    if (text === "Upload Doc") navigate("/");
                    else if (text === "Update") navigate("/updateDetails");
                    else if (text === "Delete") setDeleteOpen(true);
                    else if (text === "Logout") {
                      logout();
                      navigate("/login");
                    }
                    else if (text === "Upload Fingerprint") navigate("/uploadFingerprint");
                  }}
                  sx={{
                    color: "#000",
                    fontWeight: "bold",
                    fontSize: "18px",
                    textTransform: "none",
                    marginRight: 2,
                    padding: "8px 20px",
                    borderRadius: "10px",
                    ":hover": { color: "#FF5722", textDecoration: "underline" },
                  }}
                >
                  {text}
                </Button>
              )
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Delete Customer Modal */}
      <DeleteCustomerModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        showFeedback={showFeedback}
      />

      {/* Feedback modal */}
      {feedback.open && (
        <Dialog
          open={feedback.open}
          onClose={() => setFeedback({ ...feedback, open: false })}
        >
          <DialogTitle>{feedback.success ? "Success" : "Error"}</DialogTitle>
          <DialogContent>
            <Typography>{feedback.message}</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setFeedback({ ...feedback, open: false })}>
              OK
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
};

export default Navbar;

import React, { useState, useEffect, useContext } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Card,
  CardContent,
  Typography,
} from "@mui/material";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

const DeleteCustomerModal = ({ open, onClose, showFeedback }) => {
  const [custIdToDelete, setCustIdToDelete] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const { userId } = useContext(AuthContext);

  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    const fetchSuggestions = async () => {
      if (!custIdToDelete.trim()) {
        setSuggestions([]);
        return;
      }
      try {
        const response = await axios.post("http://localhost:8080/api/custID", {
          cust_id: custIdToDelete.trim(),
          user_id: userId,
        });
        if (response.data) {
          setSuggestions(response.data.map((item) => JSON.parse(item)));
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        if (!axios.isCancel(err)) {
          console.error(err);
          setSuggestions([]);
        }
      }
    };

    const timer = setTimeout(fetchSuggestions, 400);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [custIdToDelete, userId, open]);

  const handleDeleteCustomer = async () => {
    if (!custIdToDelete.trim()) {
      showFeedback("Customer ID cannot be empty!", false);
      return;
    }
    try {
      const response = await axios.delete(
        "http://localhost:8080/api/deleteCustomer",
        { data: { cust_id: custIdToDelete, user_id: userId } }
      );
      showFeedback(response.data.message, true);
      setCustIdToDelete("");
      setSuggestions([]);
      onClose();
    } catch (err) {
      showFeedback(
        err.response?.data?.message || "Error deleting customer",
        false
      );
    }
  };

  const handleSuggestionClick = (cust) => {
    setCustIdToDelete(cust.cust_id);
    setSuggestions([]);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Delete Customer</DialogTitle>
      <DialogContent sx={{ minHeight: suggestions.length ? 400 : 200 }}>
        {/* Container for input + suggestions */}
        <Box sx={{ position: "relative", mb: 2 }}>
          <TextField
            label="Customer ID"
            value={custIdToDelete}
            onChange={(e) => setCustIdToDelete(e.target.value)}
            fullWidth
            sx={{ mb: 1 }}
          />

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <Box
              sx={{
                position: "absolute",
                top: "56px", // slightly below input
                width: "100%",
                zIndex: 10,
              }}
            >
              {suggestions.map((cust, idx) => (
                <Card
                  key={idx}
                  variant="outlined"
                  sx={{
                    mb: 1,
                    cursor: "pointer",
                    borderRadius: 1,
                    backgroundColor: "#ffffff",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    ":hover": { backgroundColor: "#f5f5f5" },
                  }}
                  onClick={() => handleSuggestionClick(cust)}
                >
                  <CardContent sx={{ py: 1, px: 2 }}>
                    <Typography
                      variant="subtitle1"
                      fontWeight="bold"
                      color="text.primary"
                    >
                      {cust.cust_id}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {cust.name}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Box>

        <Typography sx={{ fontSize: "0.9rem", color: "gray" }}>
          Enter the Customer ID to delete all related records.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleDeleteCustomer}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteCustomerModal;

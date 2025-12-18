import React, { useState, useEffect, useContext } from "react";
import { Box, Typography, Card, CardContent, TextField } from "@mui/material";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

const UpdatePage = () => {
  const [custId, setCustId] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const user_id = useContext(AuthContext).userId;
  const navigate = useNavigate();

  const fetchUsers = async () => {
    if (!custId.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const response = await axios.post("http://localhost:8080/api/custID", {
        cust_id: custId.trim(),
        user_id: user_id,
      });
      if (response.data) {
        setSearchResults(response.data.map((item) => JSON.parse(item)));
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error(err);
      setSearchResults([]);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (custId.trim()) fetchUsers();
    }, 300); // debouncing 300ms so that HTTP overload does not happen

    return () => clearTimeout(timer);
  }, [custId]);

  const handleUserClick = (user) => {
    navigate("/user-details-update", { state: { cust_id: user.cust_id } });
  };

  return (
    <>
      <Navbar />
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          padding: 4,
          marginTop: "64px",
          minHeight: "100vh",
          backgroundColor: "#f5f5f5",
        }}
      >
        <Box sx={{ flex: 1, maxWidth: "300px", marginRight: 4 }}>
          <Typography
            variant="h5"
            sx={{ fontWeight: "bold", marginBottom: 2, color: "#FF5722" }}
          >
            Search User by ID
          </Typography>
          <TextField
            fullWidth
            label="Customer ID"
            value={custId}
            onChange={(e) => setCustId(e.target.value)}
            placeholder="Enter Customer ID"
            sx={{ mb: 2, backgroundColor: "#FFFFFF", borderRadius: "4px" }}
          />
          {searchResults.map((user, idx) => (
            <Card
              key={idx}
              sx={{ mb: 2, cursor: "pointer", ":hover": { boxShadow: 6 } }}
              onClick={() => handleUserClick(user)}
            >
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  {user.name}
                </Typography>
                <Typography variant="body2">
                  Customer ID: {user.cust_id}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>
    </>
  );
};

export default UpdatePage;

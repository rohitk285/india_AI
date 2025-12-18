import React, { useContext, useState } from "react";
import {
  Box,
  Grid,
  TextField,
  Typography,
  Card,
  CardContent,
} from "@mui/material";
import Navbar from "../components/Navbar";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const EntryPage = () => {
  const [formData, setFormData] = useState({ name: "", dob: "" });
  const [filteredResults, setFilteredResults] = useState([]);
  const navigate = useNavigate();
  const user_id = useContext(AuthContext).userId;

  const handleChange = async (e) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };
    setFormData(newFormData);

    if (!newFormData.name || newFormData.name.trim() === "") {
      setFilteredResults([]);
      return;
    }

    try {
      const response = await axios.post("http://localhost:8080/api/name", {
        name: newFormData.name.trim(),
        user_id: user_id,
      });

      if (response.status === 200) {
        // ✅ Parse each JSON string in the response
        const results = (response.data ?? []).map((str) => {
          try {
            return JSON.parse(str);
          } catch (e) {
            return null;
          }
        }).filter(Boolean); // Remove nulls from parse errors

        setFilteredResults(results);
      }
    } catch (error) {
      setFilteredResults([]);
    }
  };

  const handleUserClick = (cust_id) => {
    navigate("/user-details", { state: { userData: cust_id } });
  };

  return (
    <>
      <Navbar />
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          minHeight: "100vh",
          backgroundColor: "#FFFFFF",
          padding: 4,
          marginTop: "64px",
        }}
      >
        <Box
          sx={{
            flex: 1,
            maxWidth: "300px",
            maxHeight: "280px",
            marginRight: 4,
            backgroundColor: "#FF5722",
            padding: 4,
            borderRadius: "8px",
            boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
          }}
        >
          <Typography
            variant="h5"
            component="h2"
            sx={{ fontWeight: "bold", marginBottom: 2, color: "#FFFFFF" }}
          >
            Search User
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                name="name"
                variant="outlined"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter name"
                sx={{ backgroundColor: "#FFFFFF", borderRadius: "4px" }}
              />
            </Grid>
          </Grid>
        </Box>

        <Box
          sx={{
            flex: 2,
            backgroundColor: "#111810",
            padding: 4,
            borderRadius: "8px",
            boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
            maxHeight: "600px",
            overflow: "auto",
          }}
        >
          <Typography
            variant="h5"
            component="h2"
            sx={{ fontWeight: "bold", marginBottom: 2, color: "#FFFFFF" }}
          >
            Results
          </Typography>

          {filteredResults.length > 0 ? (
            filteredResults.map((user, index) => {
              const entities = user.entities || {};
              const documentType = Array.isArray(user.document_type)
                ? user.document_type.join(", ")
                : user.document_type;

              return (
                <Card
                  key={index}
                  sx={{
                    marginBottom: 2,
                    borderRadius: "8px",
                    backgroundColor: "#FF5722",
                    boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
                    color: "#FFFFFF",
                    ":hover": {
                      backgroundColor: "#FFFFFF",
                      color: "#000000",
                      transition: "background-color 0.3s, color 0.3s",
                    },
                    cursor: "pointer",
                  }}
                  onClick={() => handleUserClick(user.cust_id)}
                >
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                      {user.name}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      Customer ID: {user.cust_id}
                    </Typography>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Typography variant="body1" sx={{ color: "#FFFFFF" }}>
              No results found.
            </Typography>
          )}
        </Box>
      </Box>
    </>
  );
};

export default EntryPage;

import React, { useState } from "react";
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  TextField,
  FormControl,
} from "@mui/material";
import Navbar from "../components/Navbar";
import { DocumentScanner } from "@mui/icons-material";

const RetrievalPageDate = () => {
  const users = [
    { name: "Rohan Bakshi", dob: "1987-11-09", uploadedOn: "2024-09-29" },
    { name: "Rohini Deshpande", dob: "2001-07-17", uploadedOn: "2024-09-29" },
    { name: "Rohit Kumar", dob: "1995-12-12", uploadedOn: "2024-09-28" },
    { name: "Yousaf M", dob: "1975-05-14", uploadedOn: "2024-09-28" },
    { name: "Rohaan Acharya", dob: "1992-06-24", uploadedOn: "2024-12-02" },
    { name: "Rohandeep Reddy", dob: "1997-07-06", uploadedOn: "2024-09-12" },
    { name: "Manoj Reddy", dob: "1998-09-09", uploadedOn: "2024-10-12" },
    { name: "Aditya Bakshi", dob: "1988-12-30", uploadedOn: "2024-12-02" },
    { name: "Amyra Pandey", dob: "1999-07-10", uploadedOn: "2024-11-01" },
    { name: "Alapati Raju", dob: "1985-11-11", uploadedOn: "2024-11-02" },
    { name: "Govindan Narasimha", dob: "1990-08-09", uploadedOn: "2024-11-01" },
    { name: "Lakshmi Narayanan", dob: "1985-09-08", uploadedOn: "2024-11-02" },
  ];

  const [selectedDate, setSelectedDate] = useState("");
  const [filteredResults, setFilteredResults] = useState([]);

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handleSubmit = () => {
    if (!selectedDate) {
      alert("Please select an upload date.");
      return;
    }

    const results = users.filter((user) => user.uploadedOn === selectedDate);
    setFilteredResults(results);
  };

  return (
    <>
      <Navbar />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          backgroundColor: "#FFFFFF", // White background
          padding: 4,
          marginTop: "64px", // Avoid navbar overlap
        }}
      >
        {/* Top Black Box */}
        <Box
          sx={{
            backgroundColor: "#000000", // Black background
            padding: 2,
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            marginBottom: 4,
            color: "#FFFFFF", // White text
            maxWidth: "350px",
            maxHeight: "150px"
          }}
        >
          <FormControl sx={{ marginRight: 2 }}>
            <TextField
              label="Upload Date"
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              InputLabelProps={{
                shrink: true,
                style: { color: "#FFFFFF" }, // Label color
              }}
              sx={{
                backgroundColor: "#333", // Dark gray background
                color: "#FFFFFF",
                width: "200px",
              }}
            />
          </FormControl>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            sx={{
              padding: "8px 16px",
              fontWeight: "bold",
              borderRadius: "30px"
            }}
          >
            Submit
          </Button>
        </Box>

        {/* Display Results in Grid Format */}
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
          {filteredResults.length > 0 ? (
            filteredResults.map((user, index) => (
              <Card
                key={index}
                sx={{
                  position: "relative",
                  padding: 2,
                  backgroundColor: "#FF5722", // Orange background
                  color: "#FFFFFF", // White text
                  borderRadius: "8px",
                  boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
                  transition: "transform 0.3s ease, background-color 0.3s ease, color 0.3s ease",
                  "&:hover": {
                    backgroundColor: "#FFFFFF", // White background on hover
                    color: "#000000", // Black text on hover
                    transform: "scale(1.05)", // Slightly larger size
                  },
                }}
              >
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: "bold", fontFamily: "Merriweather" }}>
                    {user.name}
                  </Typography>
                  <Typography variant="body2" sx={{fontFamily: "Kanit"}}>
                    Date of Birth: {user.dob}
                  </Typography>
                  <Typography variant="body2" sx={{fontFamily: "Kanit"}}>
                    Uploaded on: {user.uploadedOn}
                  </Typography>
                </CardContent>
                {/* Document Icon */}
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 8,
                    right: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "inherit", // Matches text color
                  }}
                >
                  <DocumentScanner fontSize="large" />
                </Box>
              </Card>
            ))
          ) : (
            <Typography variant="body1" color="textSecondary">
              No results found for this date.
            </Typography>
          )}
        </Box>
      </Box>
    </>
  );
};

export default RetrievalPageDate;
